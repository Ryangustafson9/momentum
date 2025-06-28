/**
 * Enhanced Profile Section Card
 * Improved accessibility, loading states, and mobile experience
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ProfileSectionCard = ({
  title,
  description,
  icon: Icon,
  children,
  actions,
  isLoading = false,
  error = null,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  onRetry,
  headerActions,
  ...props
}) => {
  const [isColl
