import { HandleChange } from "../types/HandleChange";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

export const SwitchWithLabel = ({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: boolean | undefined;
  onChange: HandleChange;
}) => (
  <div className="flex gap-2 items-center">
    <Switch
      id={name}
      checked={value}
      onCheckedChange={(value) =>
        onChange({
          target: {
            name,
            value,
          },
        })
      }
    />
    <Label htmlFor={name}>{label}</Label>
  </div>
);
