import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInventoryItem } from "@/api/inventoryApi";
import useHousehold from "@/hooks/useHousehold";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

interface AddItemFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const COMMON_ITEMS = ["Milk", "Bread", "Eggs", "Rice", "Pasta", "Chicken", "Tomatoes", "Onions", "Potatoes", "Cheese"];

export function AddItemForm({ onSuccess, onCancel }: AddItemFormProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [lowThreshold, setLowThreshold] = useState("");
  const [errors, setErrors] = useState({ name: "", quantity: "", threshold: "" });
  const [touched, setTouched] = useState({ name: false, quantity: false, threshold: false });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { selectedHousehold } = useHousehold();
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const validate = () => {
    const newErrors = { name: "", quantity: "", threshold: "" };
    if (!name.trim()) newErrors.name = "Item name is required.";
    if (!quantity || parseInt(quantity) < 0) newErrors.quantity = "Quantity must be ≥ 0.";
    if (!lowThreshold || parseInt(lowThreshold) <= 0) newErrors.threshold = "Threshold must be > 0.";
    setErrors(newErrors);
    return !newErrors.name && !newErrors.quantity && !newErrors.threshold;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (value.length > 0) {
      const filtered = COMMON_ITEMS.filter(item => item.toLowerCase().includes(value.toLowerCase()));
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
    if (touched.name) setErrors(prev => ({ ...prev, name: value.trim() ? "" : "Item name is required." }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, quantity: true, threshold: true });
    
    if (!validate()) return;
    
    if (!selectedHousehold) {
      toast.error("Please select a household first");
      return;
    }

    setIsLoading(true);
    try {
      await createInventoryItem({
        name,
        quantity: parseInt(quantity),
        lowThreshold: parseInt(lowThreshold),
        householdId: selectedHousehold.key,
      });
      toast.success("Item added successfully");
      onSuccess();
    } catch (error) {
      console.error('APP:: AddItemForm:: Failed to add item:', error);
      toast.error("Failed to add item");
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = name.trim() && quantity && parseInt(quantity) >= 0 && lowThreshold && parseInt(lowThreshold) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Item Name</Label>
        <div className="relative">
          <Input
            ref={nameInputRef}
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => { setTouched(prev => ({ ...prev, name: true })); setTimeout(() => setShowSuggestions(false), 200); }}
            onFocus={() => name && setSuggestions(COMMON_ITEMS.filter(item => item.toLowerCase().includes(name.toLowerCase()))) && setShowSuggestions(true)}
            className={`h-11 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${errors.name && touched.name ? 'border-red-500 animate-shake' : 'border-gray-200 focus:border-blue-500'}`}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map(item => (
                <div key={item} onClick={() => { setName(item); setShowSuggestions(false); }} className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">{item}</div>
              ))}
            </div>
          )}
        </div>
        {errors.name && touched.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">Current Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={quantity}
          onChange={(e) => { setQuantity(e.target.value); if (touched.quantity) setErrors(prev => ({ ...prev, quantity: e.target.value && parseInt(e.target.value) >= 0 ? "" : "Quantity must be ≥ 0." })); }}
          onBlur={() => setTouched(prev => ({ ...prev, quantity: true }))}
          min="0"
          className={`h-11 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${errors.quantity && touched.quantity ? 'border-red-500 animate-shake' : 'border-gray-200 focus:border-blue-500'}`}
        />
        {errors.quantity && touched.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lowThreshold" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Low Stock Threshold
        </Label>
        <Input
          id="lowThreshold"
          type="number"
          value={lowThreshold}
          onChange={(e) => { setLowThreshold(e.target.value); if (touched.threshold) setErrors(prev => ({ ...prev, threshold: e.target.value && parseInt(e.target.value) > 0 ? "" : "Threshold must be > 0." })); }}
          onBlur={() => setTouched(prev => ({ ...prev, threshold: true }))}
          min="1"
          className={`h-11 rounded-lg border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 ${errors.threshold && touched.threshold ? 'border-red-500 animate-shake' : 'border-gray-200 focus:border-blue-500'}`}
        />
        <p className="text-xs text-gray-500 mt-1">We'll notify you when quantity drops below this value.</p>
        {errors.threshold && touched.threshold && <p className="text-xs text-red-600 mt-1">{errors.threshold}</p>}
      </div>

      <div className="flex gap-2.5 pt-3">
        <Button type="submit" disabled={!isValid || isLoading} className="flex-1 h-11 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]">
          {isLoading ? "Adding..." : "Add Item"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} className="h-11 px-6 rounded-lg font-medium transition-all hover:bg-gray-100">
          Cancel
        </Button>
      </div>
    </form>
  );
}