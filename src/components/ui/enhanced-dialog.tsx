import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  VisuallyHidden
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EnhancedDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  hideTitle?: boolean;
  hideDescription?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Enhanced Dialog that automatically includes required accessibility attributes
 * to prevent console warnings about missing DialogTitle and Description.
 * 
 * Usage:
 * <EnhancedDialog open={isOpen} onOpenChange={setIsOpen} title="My Dialog">
 *   <div>Content here</div>
 * </EnhancedDialog>
 */
export const EnhancedDialog: React.FC<EnhancedDialogProps> = ({
  open = false,
  onOpenChange,
  title = "Dialog",
  description,
  hideTitle = false,
  hideDescription = true,
  className,
  children
}) => {
  const descriptionId = description ? "dialog-description" : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn("sm:max-w-md", className)}
        aria-describedby={hideDescription ? undefined : descriptionId}
      >
        <DialogHeader>
          {hideTitle ? (
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
          
          {description && !hideDescription && (
            <DialogDescription id={descriptionId}>
              {description}
            </DialogDescription>
          )}
          
          {hideDescription && description && (
            <VisuallyHidden>
              <DialogDescription id={descriptionId}>
                {description}
              </DialogDescription>
            </VisuallyHidden>
          )}
        </DialogHeader>
        
        {children}
      </DialogContent>
    </Dialog>
  );
};