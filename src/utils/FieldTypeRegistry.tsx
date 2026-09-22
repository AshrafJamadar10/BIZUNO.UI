export type PropKind = 'boolean' | 'string' | 'number' | 'enum';

export interface PropSchema {
  key: string;
  label: string;
  kind: PropKind;
  default: string | number | boolean;
  hint?: string;
  options?: { value: string | number; label: string }[];
}

export interface FieldTypeSchema {
  type: string;
  title: string;
  description: string;
  emoji: string;
  component: string;
  props: PropSchema[];
}

export const FIELD_TYPE_SCHEMAS: FieldTypeSchema[] = [
  {
    type: 'text',
    title: 'Short Text',
    description: 'One-line answer — name, city, ID.',
    emoji: '📝',
    component: 'TextInputField',
    props: [
      {
        key: 'inputType', label: 'Allowed characters', kind: 'enum', default: 'all',
        options: [
          { value: 'all', label: 'Any character' },
          { value: 'alphabet', label: 'Letters only' },
          { value: 'alphanumeric', label: 'Letters + numbers' },
          { value: 'numbers', label: 'Numbers only' },
        ],
        hint: 'Restricts what the user can type.',
      },
      { key: 'minLength', label: 'Minimum length', kind: 'number', default: '', hint: 'Fewest characters allowed.' },
      { key: 'maxLength', label: 'Maximum length', kind: 'number', default: '', hint: 'Most characters allowed.' },
    ],
  },
  {
    type: 'textarea', title: 'Long Text', description: 'Paragraph — remarks, notes.',
    emoji: '📄', component: 'TextInputField',
    props: [
      { key: 'rows', label: 'Rows', kind: 'number', default: 3, hint: 'Visible lines.' },
      { key: 'minLength', label: 'Minimum length', kind: 'number', default: '' },
      { key: 'maxLength', label: 'Maximum length', kind: 'number', default: '' },
    ],
  },
  {
    type: 'email', title: 'Email Address', description: 'Validated email input.',
    emoji: '📧', component: 'EmailField', props: [],
  },
  {
    type: 'mobile', title: 'Mobile Number', description: 'Phone with +91 prefix.',
    emoji: '📱', component: 'MobileField', props: [],
  },
  {
    type: 'aadhaar', title: 'Aadhaar Number', description: '12-digit Aadhaar with formatting.',
    emoji: '🆔', component: 'AadhaarCardField', props: [],
  },
  {
    type: 'search', title: 'Search Box', description: 'Input with magnifying-glass icon.',
    emoji: '🔍', component: 'SearchField', props: [],
  },
  {
    type: 'password', title: 'Password', description: 'Masked input with strength meter.',
    emoji: '🔒', component: 'PasswordField',
    props: [
      { key: 'minLength', label: 'Minimum length', kind: 'number', default: 8 },
      { key: 'maxLength', label: 'Maximum length', kind: 'number', default: 32 },
      {
        key: 'showStrengthIndicator', label: 'Show strength meter', kind: 'boolean',
        default: true, hint: 'Shows a bar indicating password strength.',
      },
    ],
  },
  {
    type: 'number', title: 'Number', description: 'Quantity, price, age.',
    emoji: '🔢', component: 'NumericField',
    props: [
      { key: 'min', label: 'Minimum value', kind: 'number', default: 0 },
      { key: 'max', label: 'Maximum value', kind: 'number', default: 100 },
      { key: 'decimal', label: 'Allow decimals', kind: 'boolean', default: false, hint: 'Permit decimal numbers like 12.50.' },
      { key: 'decimalDigits', label: 'Decimal places', kind: 'number', default: 2, hint: 'Only used when decimals are allowed.' },
      { key: 'maxlength', label: 'Max digits', kind: 'number', default: 10 },
    ],
  },
  {
    type: 'select', title: 'Dropdown (Single)', description: 'Choose one value from a list.',
    emoji: '🔽', component: 'DropdownField',
    props: [
      { key: 'freeSolo', label: 'Allow custom value', kind: 'boolean', default: false, hint: 'Let the user type a value not in the list.' },
      { key: 'editable', label: 'Editable', kind: 'boolean', default: false },
      { key: 'onlyAlphabet', label: 'Letters only', kind: 'boolean', default: false },
      { key: 'onlyNumber', label: 'Numbers only', kind: 'boolean', default: false },
      { key: 'alphanumeric', label: 'Letters and numbers only', kind: 'boolean', default: false },
    ],
  },
  {
    type: 'multiselect', title: 'Dropdown (Multiple)', description: 'Choose many from a list.',
    emoji: '📚', component: 'DropdownField',
    props: [
      { key: 'freeSolo', label: 'Allow custom value', kind: 'boolean', default: true },
      { key: 'editable', label: 'Editable', kind: 'boolean', default: true },
    ],
  },
  {
    type: 'radio', title: 'Radio Buttons', description: 'Pick exactly one — 2 to 5 options.',
    emoji: '🔘', component: 'RadioField', props: [],
  },
  {
    type: 'checkbox', title: 'Single Checkbox', description: 'A yes / no toggle — "I agree".',
    emoji: '☑️', component: 'Checkbox (raw MUI)', props: [],
  },
  {
    type: 'checkboxGroup', title: 'Checkbox Group', description: 'Tick multiple items.',
    emoji: '✅', component: 'CheckboxGroup', props: [],
  },
  {
    type: 'date', title: 'Date', description: 'Pick a calendar date.',
    emoji: '📅', component: 'DateTimeField',
    props: [{ key: 'useCurrentDate', label: 'Use today as default', kind: 'boolean', default: false }],
  },
  {
    type: 'time', title: 'Time', description: 'Pick a time of day.',
    emoji: '⏰', component: 'DateTimeField',
    props: [{ key: 'useCurrentDate', label: 'Use current time as default', kind: 'boolean', default: false }],
  },
  {
    type: 'datetime', title: 'Date & Time', description: 'Full date and time.',
    emoji: '🕒', component: 'DateTimeField',
    props: [{ key: 'useCurrentDate', label: 'Use current moment as default', kind: 'boolean', default: false }],
  },
  {
    type: 'file', title: 'File Upload', description: 'Upload a document.',
    emoji: '📎', component: 'FileUpload',
    props: [
      { key: 'maxFiles', label: 'Maximum files', kind: 'number', default: 5 },
      { key: 'maxSizeMB', label: 'Maximum size (MB)', kind: 'number', default: 10 },
      { key: 'accept', label: 'Allowed file types', kind: 'string', default: '.pdf,.doc,.docx,.xlsx,.csv', hint: 'Comma separated. Example: .pdf,.jpg,.png' },
      { key: 'fullWidth', label: 'Full width', kind: 'boolean', default: true },
    ],
  },
  {
    type: 'photo', title: 'Photo Upload', description: 'Upload a picture.',
    emoji: '🖼️', component: 'PhotoUpload',
    props: [
      { key: 'maxFiles', label: 'Maximum photos', kind: 'number', default: 5 },
      { key: 'maxSizeMB', label: 'Maximum size (MB)', kind: 'number', default: 10 },
      { key: 'targetSizeKB', label: 'Target size after compression (KB)', kind: 'number', default: 100 },
      { key: 'compress', label: 'Compress images', kind: 'boolean', default: true },
      { key: 'cropEnabled', label: 'Allow cropping', kind: 'boolean', default: false },
      { key: 'cameraEnabled', label: 'Allow camera capture', kind: 'boolean', default: true },
      { key: 'showCompressionInfo', label: 'Show compression info', kind: 'boolean', default: false },
    ],
  },
  {
    type: 'heading', title: 'Section Heading', description: 'Title to group fields — no input.',
    emoji: '🏷️', component: '—', props: [],
  },
  {
    type: 'divider', title: 'Divider', description: 'A horizontal line to separate.',
    emoji: '➖', component: '—', props: [],
  },
];

export const FIELD_TYPE_SCHEMA_MAP: Record<string, FieldTypeSchema> =
  FIELD_TYPE_SCHEMAS.reduce((acc, schema) => {
    acc[schema.type] = schema;
    return acc;
  }, {} as Record<string, FieldTypeSchema>);

export function defaultPropsFor(type: string): Record<string, string | number | boolean> {
  const schema = FIELD_TYPE_SCHEMA_MAP[type];
  if (!schema) return {};
  return schema.props.reduce((acc, prop) => {
    if (prop.default !== '') acc[prop.key] = prop.default;
    return acc;
  }, {} as Record<string, string | number | boolean>);
}