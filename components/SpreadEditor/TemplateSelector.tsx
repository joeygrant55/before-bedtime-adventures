"use client";

type TemplateType = "single" | "duo" | "trio";

interface TemplateSelectorProps {
  selected: TemplateType;
  onChange: (template: TemplateType) => void;
}

const TEMPLATES = [
  {
    id: "single" as const,
    name: "Single",
    icon: "📷",
    description: "One large photo",
    preview: (
      <div className="w-full h-12 bg-purple-200 rounded border-2 border-purple-300" />
    ),
  },
  {
    id: "duo" as const,
    name: "Side by Side",
    icon: "📷📷",
    description: "Two photos",
    preview: (
      <div className="w-full h-12 flex gap-1">
        <div className="flex-1 bg-purple-200 rounded border-2 border-purple-300" />
        <div className="flex-1 bg-purple-200 rounded border-2 border-purple-300" />
      </div>
    ),
  },
  {
    id: "trio" as const,
    name: "Gallery",
    icon: "📷📷📷",
    description: "Three photos",
    preview: (
      <div className="w-full h-12 flex flex-col gap-1">
        <div className="flex-1 flex gap-1">
          <div className="flex-1 bg-purple-200 rounded border-2 border-purple-300" />
          <div className="flex-1 bg-purple-200 rounded border-2 border-purple-300" />
        </div>
        <div className="flex-1 bg-purple-200 rounded border-2 border-purple-300" />
      </div>
    ),
  },
];

export function TemplateSelector({ selected, onChange }: TemplateSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h4 className="text-sm font-semibold text-gray-700">Layout Template</h4>
      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onChange(template.id)}
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
              selected === template.id
                ? "border-purple-600 bg-purple-50 shadow-lg scale-105"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <div className="text-3xl">{template.icon}</div>
            <div className="w-full">{template.preview}</div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500">{template.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
