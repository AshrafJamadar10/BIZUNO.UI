import { type FC } from 'react';
import { TextField, type SxProps, type TextFieldProps, type Theme } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { emailRegex, emailDomainRegex, SanitizeEmailRegex } from '@/constant/RegixPattern';
import { getComponentTranslations } from '@/helpers/useTranslations';
import { useTranslation } from 'react-i18next';

type EmailFieldProps = TextFieldProps & {
  label: string;
  name: string;
  required?: boolean;
  sx?: SxProps<Theme>;
};

const EmailField: FC<EmailFieldProps> = ({ label, name, sx,size = 'small', required = false, ...rest }) => {
  const { t } = useTranslation();
  const translations = getComponentTranslations(t);
  const {
    control,
    formState: { errors }
  } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: required ? translations.emailField.requiredError(label) : undefined,
        validate: (value: string) => {
          if (!value) return true;
          if (!emailRegex.test(value)) return translations.emailField.invalidFormat;
          if (!emailDomainRegex.test(value)) return translations.emailField.invalidDomain;
          return true;
        }
      }}
      render={({ field }) => (
        <TextField
          {...field}
          {...rest}
          size={size}
          label={label}
          inputMode="email"
          type="email"
          value={field.value || ''}
          fullWidth
          required={required}
          error={!!errors[name]}
          helperText={errors[name]?.message ? String(errors[name].message) : undefined}
          onChange={(e) => field.onChange(SanitizeEmailRegex(e.target.value))}
           slotProps={{
    ...rest.slotProps,
    inputLabel: {
      ...rest.slotProps?.inputLabel,
      shrink: rest.placeholder ? true : undefined,
    },
  }}
          sx={{ '& .MuiInputLabel-asterisk': { color: 'error.main' }, ...sx }}
        />
      )}
    />
  );
};

export default EmailField;
