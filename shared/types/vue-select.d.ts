// Declaración de tipos para vue-select
declare module "vue-select" {
  import type { DefineComponent } from "vue";
  import { PropType } from "vue";

  export interface VueSelectOption {
    label: string
    value: string | number | boolean
    description?: string
    [key: string]: any
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
    reduce?: (option: VueSelectOption) => any
    getOptionLabel?: (option: VueSelectOption) => string
    getOptionKey?: (option: VueSelectOption) => string | number
  }

  export interface VueSelectEmits {
    "update:modelValue": [value: any]
    "search": [query: string]
    "option:selected": [option: VueSelectOption]
    "option:deselected": [option: VueSelectOption]
    "open": []
    "close": []
  }

  const VueSelect: DefineComponent<VueSelectProps>;
  export default VueSelect;
}
