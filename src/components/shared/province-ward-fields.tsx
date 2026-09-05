"use client";

import { useState, useTransition } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWardsByProvince, type LocationOption } from "@/lib/services/location.service";

interface ProvinceWardFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  provinceFieldName: Path<TFieldValues>;
  wardFieldName: Path<TFieldValues>;
  provinces: LocationOption[];
  /** Pre-fetched wards for the field's current province value (edit mode) — avoids an empty ward select on first render. */
  initialWards?: LocationOption[];
  provinceRequired?: boolean;
}

export function ProvinceWardFields<TFieldValues extends FieldValues>({
  control,
  provinceFieldName,
  wardFieldName,
  provinces,
  initialWards = [],
  provinceRequired = false,
}: ProvinceWardFieldsProps<TFieldValues>) {
  const [wards, setWards] = useState<LocationOption[]>(initialWards);
  const [isLoadingWards, startTransition] = useTransition();

  const provinceField = useController({ control, name: provinceFieldName });
  const wardField = useController({ control, name: wardFieldName });

  function handleProvinceChange(name: string) {
    provinceField.field.onChange(name);
    wardField.field.onChange("");

    const province = provinces.find((p) => p.name === name);
    if (!province) {
      setWards([]);
      return;
    }
    startTransition(async () => {
      const result = await getWardsByProvince(province.code);
      setWards(result);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Tỉnh/thành phố{provinceRequired ? " *" : ""}</Label>
        <Select value={(provinceField.field.value as string) ?? ""} onValueChange={handleProvinceChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Chọn tỉnh/thành phố" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((province) => (
              <SelectItem key={province.code} value={province.name}>
                {province.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {provinceField.fieldState.error && (
          <p className="text-destructive text-sm">{provinceField.fieldState.error.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Phường/xã</Label>
        <Select
          value={(wardField.field.value as string) ?? ""}
          onValueChange={wardField.field.onChange}
          disabled={wards.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoadingWards ? "Đang tải..." : "Chọn phường/xã"} />
          </SelectTrigger>
          <SelectContent>
            {wards.map((ward) => (
              <SelectItem key={ward.code} value={ward.name}>
                {ward.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
