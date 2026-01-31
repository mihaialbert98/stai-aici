import { Info, BookOpen, Compass } from 'lucide-react';

interface Props {
  checkInInfo?: string | null;
  houseRules?: string | null;
  localTips?: string | null;
}

const sections = [
  { key: 'checkInInfo', icon: Info, label: 'Instrucțiuni check-in' },
  { key: 'houseRules', icon: BookOpen, label: 'Regulile casei' },
  { key: 'localTips', icon: Compass, label: 'Recomandări locale' },
] as const;

export function PropertyGuide({ checkInInfo, houseRules, localTips }: Props) {
  const data: Record<string, string | null | undefined> = { checkInInfo, houseRules, localTips };
  const visible = sections.filter(s => data[s.key]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ghidul oaspetelui</h2>
      {visible.map(({ key, icon: Icon, label }) => (
        <div key={key} className="card">
          <h3 className="font-medium flex items-center gap-2 mb-2">
            <Icon size={16} className="text-primary-500" /> {label}
          </h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">{data[key]}</p>
        </div>
      ))}
    </div>
  );
}
