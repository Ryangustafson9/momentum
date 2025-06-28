/**
 * Member Profile Context
 * Centralized state management for member profile components
 * Eliminates prop drilling and provides optimized re-rendering
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { memberService } from '@/services/memberService';

// ==================== CONTEXT SETUP ====================

const MemberProfileContext = createContext(null);

// ==================== ACTION TYPES ====================

const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_MEMBER_DATA: 'SET_MEMBER_DATA',
  SET_ERROR: 'SET_ERROR',
  SET_EDITING_SECTION: 'SET_EDITING_SECTION',
  UPDATE_SECTION_DATA: 'UPDATE_SECTION_DATA',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  SET_SAVING: 'SET_SAVING',
  RESET_FORM: 'RESET_FORM'
};

// ==================== REDUCER ====================

const initialState = {
  // Data state
  memberData: null,
  originalData: null,
  
  // UI state
  isLoading: false,
  isSaving: false,
  error: null,
  
  // Edit state
  editingSections: new Set(),
  sectionData: {},
  validationErrors: {},
  
  // Tab state
  activeTab: 'profile'
};

function memberProfileReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error
      };

    case ACTIONS.SET_MEMBER_DATA:
      return {
        ...state,
        memberData: action.payload,
        originalData: action.payload,
        isLoading: false,
        error: null
      };

    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isSaving: false
      };

    case ACTIONS.SET_EDITING_SECTION:
      const newEditingSections = new Set(state.editingSections);
      if (action.payload.isEditing) {
        newEditingSections.add(action.payload.section);
      } else {
        newEditingSections.delete(action.payload.section);
      }
      
      return {
        ...state,
        editingSections: newEditingSections,
        sectionData: action.payload.isEditing 
          ? { ...state.sectionData, [action.payload.section]: action.payload.data || {} }
          : { ...state.sectionData, [action.payload.section]: undefined }
      };

    case ACTIONS.UPDATE_SECTION_DATA:
      return {
        ...state,
        sectionData: {
          ...state.sectionData,
          [action.payload.section]: {
            ...state.sectionData[action.payload.section],
            ...action.payload.data
          }
        }
      };

    case ACTIONS.SET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.section]: action.payload.errors
        }
      };

    case ACTIONS.SET_SAVING:
      return {
        ...state,
        isSaving: action.payload
      };

    case ACTIONS.RESET_FORM:
      return {
        ...state,
        editingSections: new Set(),
        sectionData: {},
        validationErrors: {},
        isSaving: false
      };

    default:
      return state;
  }
}

// ==================== PROVIDER COMPONENT ====================

export const MemberProfileProvider = ({ children, memberId }) => {
  const [state, dispatch] = useReducer(memberProfileReducer, initialState);
  const { toast } = useToast();

  // ==================== ACTIONS ====================

  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ACTIONS.SET_ERROR, payload: error });
  }, []);

  const loadMemberData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await memberService.getMemberProfile(memberId);
      dispatch({ type: ACTIONS.SET_MEMBER_DATA, payload: data });
    } catch (error) {
      console.error('Error loading member data:', error);
      setError(error.message || 'Failed to load member data');
      toast({
        title: "Error",
        description: "Failed to load member profile",
        variant: "destructive"
      });
    }
  }, [memberId, toast]);

  const startEditing = useCallback((section, initialData = null) => {
    const sectionData = initialData || state.memberData;
    dispatch({
      type: ACTIONS.SET_EDITING_SECTION,
      payload: { section, isEditing: true, data: sectionData }
    });
  }, [state.memberData]);

  const cancelEditing = useCallback((section) => {
    dispatch({
      type: ACTIONS.SET_EDITING_SECTION,
      payload: { section, isEditing: false }
    });
    
    // Clear validation errors for this section
    dispatch({
      type: ACTIONS.SET_VALIDATION_ERRORS,
      payload: { section, errors: {} }
    });
  }, []);

  const updateSectionData = useCallback((section, data) => {
    dispatch({
      type: ACTIONS.UPDATE_SECTION_DATA,
      payload: { section, data }
    });
  }, []);

  const saveSectionData = useCallback(async (section, data) => {
    try {
      dispatch({ type: ACTIONS.SET_SAVING, payload: true });
      
      // Here you would call the appropriate service method
      // await memberService.updateMemberSection(memberId, section, data);
      
      // For now, just update the local state
      dispatch({
        type: ACTIONS.SET_MEMBER_DATA,
        payload: { ...state.memberData, ...data }
      });
      
      cancelEditing(section);
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      
    } catch (error) {
      console.error('Error saving section data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: ACTIONS.SET_SAVING, payload: false });
    }
  }, [state.memberData, memberId, toast, cancelEditing]);

  const setValidationErrors = useCallback((section, errors) => {
    dispatch({
      type: ACTIONS.SET_VALIDATION_ERRORS,
      payload: { section, errors }
    });
  }, []);

  // ==================== COMPUTED VALUES ====================

  const contextValue = useMemo(() => ({
    // State
    ...state,
    
    // Computed
    isEditing: (section) => state.editingSections.has(section),
    getSectionData: (section) => state.sectionData[section] || {},
    getSectionErrors: (section) => state.validationErrors[section] || {},
    hasUnsavedChanges: state.editingSections.size > 0,
    
    // Actions
    loadMemberData,
    startEditing,
    cancelEditing,
    updateSectionData,
    saveSectionData,
    setValidationErrors,
    setError
  }), [
    state,
    loadMemberData,
    startEditing,
    cancelEditing,
    updateSectionData,
    saveSectionData,
    setValidationErrors,
    setError
  ]);

  return (
    <MemberProfileContext.Provider value={contextValue}>
      {children}
    </MemberProfileContext.Provider>
  );
};

// ==================== HOOK ====================

export const useMemberProfile = () => {
  const context = useContext(MemberProfileContext);
  if (!context) {
    throw new Error('useMemberProfile must be used within a MemberProfileProvider');
  }
  return context;
};

export default MemberProfileContext;
