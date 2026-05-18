// Declaración de tipos para vue-select
declare module "vue-select" {
  import type { DefineComponent } from "vue";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface SelectOption<T = string> {
    label: string
    value: string | number | boolean
    description?: string
    [key: string]: unknown
  }

  export interface VueSelectProps {
    modelValue?: string | number | VueSelectOption | (string | number | VueSelectOption)[] | null
    options?: VueSelectOption[] | string[] | number[]
    placeholder?: string
    disabled?: boolean
    loading?: boolean
    clearable?: boolean
    searchable?: boolean
    multiple?: boolean
    closeOnSelect?: boolean
    maxHeight?: number
    reduce?: (option: VueSelectOption) => unknown
    getOptionLabel?: (option: VueSelectOption) => string
    getOptionKey?: (option: VueSelectOption) => string | number
  }

  export interface VueSelectEmits {
    "update:modelValue": [value: unknown]
    "search": [query: string]
    "option:selected": [option: VueSelectOption]
    "option:deselected": [option: VueSelectOption]
    "open": []
    "close": []
  }

  const VueSelect: DefineComponent<VueSelectProps>;
  export default VueSelect;
}
