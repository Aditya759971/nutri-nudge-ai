import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { type GroceryList, formatGroceryListAsText } from '@/lib/grocery-generator';
import { useToast } from '@/hooks/use-toast';

interface GroceryListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groceryList: GroceryList;
}

export function GroceryListModal({ open, onOpenChange, groceryList }: GroceryListModalProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    const text = formatGroceryListAsText(groceryList);
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Grocery list copied to clipboard",
    });
  };

  const handleDownload = () => {
    const text = formatGroceryListAsText(groceryList);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nutrinudge-grocery-list.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Grocery list saved as text file",
    });
  };

  const categories = [
    { key: 'proteins', label: '🍗 Proteins', items: groceryList.proteins },
    { key: 'grains', label: '🌾 Grains', items: groceryList.grains },
    { key: 'vegetables', label: '🥗 Vegetables', items: groceryList.vegetables },
    { key: 'fruits', label: '🍎 Fruits', items: groceryList.fruits },
    { key: 'dairy', label: '🥛 Dairy', items: groceryList.dairy },
    { key: 'pantry', label: '🧂 Pantry', items: groceryList.pantry },
    { key: 'other', label: '📦 Other', items: groceryList.other }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>🛒 Grocery List</DialogTitle>
          <DialogDescription>
            Everything you need for your weekly meal plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-96 pr-2">
          {categories.map(({ key, label, items }) => {
            if (items.length === 0) return null;
            
            return (
              <div key={key} className="border-b border-border pb-3">
                <h3 className="font-semibold text-lg mb-2">{label}</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {items.map((item, idx) => (
                    <li key={idx} className="text-sm flex justify-between">
                      <span>• {item.name}</span>
                      <span className="text-muted-foreground">{item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCopy} className="flex-1">
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button variant="default" onClick={handleDownload} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download as Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
