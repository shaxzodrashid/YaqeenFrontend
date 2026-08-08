import { useState, useEffect } from 'react';
import { Modal, Button } from '@heroui/react';
import { Plus, Edit2 } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import type { KanbanBoard } from '../../services/api';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description?: string }) => Promise<void>;
  board?: KanbanBoard | null;
}

export function BoardModal({ isOpen, onClose, onSave, board }: BoardModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.name || '');
      setDescription(board.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [board, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="max-w-md w-full bg-surface dark:bg-night-sidebar border border-border/60 shadow-2xl rounded-2xl overflow-hidden p-0">
          <Modal.CloseTrigger className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-foreground hover:bg-border/30 transition-colors cursor-pointer" />

          <form onSubmit={handleSubmit}>
            <Modal.Header className="flex items-center gap-3 border-b border-border/40 px-6 py-4">
              <div className="size-10 rounded-xl bg-brand-gold/15 flex items-center justify-center border border-brand-gold/30 text-brand-gold">
                {board ? <Edit2 className="size-5" /> : <Plus className="size-5" />}
              </div>
              <div>
                <Modal.Heading className="text-base font-bold text-foreground">
                  {board ? t('taskEditBoard') : t('taskNewBoard')}
                </Modal.Heading>
                <p className="text-xs text-muted">
                  {board ? 'Modify board settings' : 'Create a new Kanban workspace'}
                </p>
              </div>
            </Modal.Header>

            <Modal.Body className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                  Board Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Operations Board, Sales Pipeline"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the workflow or goals of this board..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-brand-gold/40 resize-none"
                />
              </div>
            </Modal.Body>

            <Modal.Footer className="border-t border-border/40 px-6 py-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={onClose}
                isDisabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-border/20 hover:bg-border/40 text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isDisabled={loading || !name.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-gold text-brand-navy hover:opacity-90 transition-opacity cursor-pointer"
              >
                {board ? 'Save Changes' : 'Create Board'}
              </Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
