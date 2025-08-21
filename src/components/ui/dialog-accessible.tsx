import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, VisuallyHidden } from '@/components/ui/dialog';

interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Accessible Dialog wrapper that ensures DialogContent has proper DialogTitle and Description
 * for screen reader users. Fixes console warnings about missing accessibility attributes.
 */
export const AccessibleDialog: React.FC<AccessibleDialogProps> = ({
  open,
  onOpenChange,
  title = "Dialog",
  description = "Dialog content",
  hideTitle = false,
  hideDescription = false,
  className,
  children
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} {...(hideDescription ? {} : { 'aria-describedby': "dialog-description" })}>
        <DialogHeader>
          {hideTitle ? (
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          {!hideDescription && (
            <DialogDescription id="dialog-description">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};