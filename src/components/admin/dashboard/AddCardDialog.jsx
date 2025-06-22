import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ALL_AVAILABLE_CARDS_CONFIG } from '@/components/admin/dashboard/dashboardConfig.jsx';

const AddCardDialog = ({ open, onOpenChange, onAddCard, currentVisibleCardIds }) => {
  const [selectedCardId, setSelectedCardId] = useState('');
  const availableCardsToAdd = ALL_AVAILABLE_CARDS_CONFIG.filter(card => !currentVisibleCardIds.includes(card.id));

  const handleAdd = () => {
    if (selectedCardId) {
      onAddCard(selectedCardId);
      setSelectedCardId('');
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const availableCards = [
    { id: 'totalMembers', title: 'Total Members' },
    { id: 'activeClasses', title: 'Active Classes' },
    { id: 'checkInsToday', title: 'Check-ins Today' },
    { id: 'recentActivity', title: 'Recent Activity' },
    { id: 'quickStats', title: 'Quick Stats' }
  ];

  const hiddenCards = availableCards.filter(card => !currentVisibleCardIds.includes(card.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle>Add Card to Dashboard</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="card-select" className="text-right col-span-1">
              Card
            </Label>
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger id="card-select" className="col-span-3">
                <SelectValue placeholder="Select a card" />
              </SelectTrigger>
              <SelectContent>
                {availableCardsToAdd.length > 0 ? (
                  availableCardsToAdd.map(card => (
                    <SelectItem key={card.id} value={card.id}>{card.title}</SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">No more cards to add.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedCardId || availableCardsToAdd.length === 0}>Add Card</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCardDialog;



