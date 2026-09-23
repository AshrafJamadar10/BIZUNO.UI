import { type FC } from "react";
import { TextField, type SxProps, type TextFieldProps, type Theme } from "@mui/material";
import { useFormContext, Controller, type ValidationRule } from "react-hook-form";
import { decimalRegex, numericRegex } from "@/constant/RegixPattern";
import { getComponentTranslations } from "@/helpers/useTranslations";
import { useTranslation } from "react-i18next";

type NumericFieldProps = TextFieldProps & {
  name: string;
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
  decimal?: boolean;
  decimalDigits?: number;
  maxlength?: number;
  sx?: SxProps<Theme>;
};

const NumericField: FC<NumericFieldProps> = ({
  name,
  label,
  required = false,
  min = 0,
  max = 100,
  size = 'small',
  decimal = false,
  decimalDigits = 2,
  maxlength = 10,
  sx,
  ...rest
}) => {
  const { t } = useTranslation();
  const translations = getComponentTranslations(t);
  const { control, formState: { errors } } = useFormContext();

  const sanitizeValue = (value: string) => {
    if (decimal) {
      value = value.replace(/[^0-9.]/g, "");
      const parts = value.split(".");
      if (parts.length > 2) value = parts[0] + "." + parts.slice(1).join("");
      if (parts[1]?.length > decimalDigits) {
        parts[1] = parts[1].slice(0, decimalDigits);
        value = parts.join(".");
      }
    } else {
      value = value.replace(/\D/g, "");
    }
    return maxlength ? value.slice(0, maxlength) : value;
  };

  const requiredRule: ValidationRule<boolean> | undefined = required
    ? {
        value: true,
        message: translations.numericField.requiredError(label),
      }
    : undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: requiredRule,
        validate: (value: string) => {
          if (value === "" || value === null || value === undefined) return true;

          if (decimal) {
            if (!decimalRegex.test(value))
              return translations.numericField.invalidNumber(label);
          } else {
            if (!numericRegex.test(value))
              return translations.numericField.onlyNumbers(label);
          }

          const numericValue = parseFloat(value);
          if (isNaN(numericValue))
            return translations.numericField.invalidNumber(label);
          if (numericValue < min)
            return translations.numericField.minValue(label, min);
          if (numericValue > max)
            return translations.numericField.maxValue(label, max);

          if (decimal && String(value).includes(".")) {
            const decimals = String(value).split(".")[1] || "";
            if (decimals.length > decimalDigits) {
              return translations.numericField.decimalLimit(label, decimalDigits);
            }
          }

          return true;
        },
      }}
      render={({ field }) => (
        <TextField
          {...field}
          {...rest}
          size={size}
          label={label}
          type="text"
          fullWidth
          value={field.value ?? ""}
          onChange={(e) => {
            const sanitized = sanitizeValue(e.target.value);
            field.onChange(sanitized);
          }}
          error={!!errors[name]}
          helperText={typeof errors[name]?.message === "string" ? errors[name]?.message : undefined}
          slotProps={{
  ...rest.slotProps,
  inputLabel: {
    ...rest.slotProps?.inputLabel,
    shrink: rest.placeholder ? true : undefined,
  },
  htmlInput: {
    ...rest.slotProps?.htmlInput,
    maxLength: maxlength,
  },
}}
          required={required}
          sx={{ "& .MuiInputLabel-asterisk": { color: "error.main" }, ...sx }}
        />
      )}
    />
  );
};

export default NumericField;