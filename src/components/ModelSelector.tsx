import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Brain, Zap, Sparkles, Bot } from "lucide-react";

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
}

const AI_MODELS = [
  {
    id: 'gpt',
    name: 'GPT-4',
    description: 'OpenAI\'s flagship model',
    icon: Brain,
    gradient: 'bg-gradient-gpt',
    shadow: 'shadow-model-gpt',
    color: 'text-gpt-primary'
  },
  {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s reasoning model',
    icon: Zap,
    gradient: 'bg-gradient-claude',
    shadow: 'shadow-model-claude',
    color: 'text-claude-primary'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s multimodal AI',
    icon: Sparkles,
    gradient: 'bg-gradient-gemini',
    shadow: 'shadow-model-gemini',
    color: 'text-gemini-primary'
  },
  {
    id: 'grok',
    name: 'Grok',
    description: 'X.AI\'s conversational AI',
    icon: Bot,
    gradient: 'bg-gradient-grok',
    shadow: 'shadow-model-grok',
    color: 'text-grok-primary'
  }
];

export const ModelSelector = ({ selectedModels, onSelectionChange }: ModelSelectorProps) => {
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-3">
      {AI_MODELS.map((model) => {
        const Icon = model.icon;
        const isSelected = selectedModels.includes(model.id);
        
        return (
          <Card
            key={model.id}
            className={`p-4 cursor-pointer transition-all duration-300 hover:scale-105 ${
              isSelected 
                ? `${model.shadow} border-opacity-50 ${model.gradient} bg-opacity-20` 
                : 'hover:shadow-soft'
            }`}
            onClick={() => toggleModel(model.id)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={model.id}
                checked={isSelected}
                onChange={() => {}} // Controlled by card click
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isSelected ? 'text-foreground' : model.color}`} />
                  <Label
                    htmlFor={model.id}
                    className={`font-medium cursor-pointer ${
                      isSelected ? 'text-foreground font-semibold' : model.color
                    }`}
                  >
                    {model.name}
                  </Label>
                </div>
                <p className={`text-sm ${isSelected ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                  {model.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};