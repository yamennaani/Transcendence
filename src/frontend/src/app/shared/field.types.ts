export type FieldType = TextField | NumField | ToggleField | SliderField | FileField | TextArea | DateField | ColorField | SelectField
export type FieldValue = string | number | boolean | string[] | undefined

export interface BaseField {
  icon:string,
  label:string,
  required:boolean,
  allowEdit: boolean
}


export interface TextField extends BaseField{
  type: 'text'
  value: string | undefined
}

export interface NumField extends BaseField{
  type: 'num'
  value: number
}

export interface ToggleField extends BaseField{
  type: 'toggle'
  value:boolean
}

export interface SliderField extends BaseField{
  type: 'slider'  
  value:number,
  min:number,
  max:number
}

export interface FileField extends BaseField{
  type: 'file',
  accept: string[] | undefined
  value: string | undefined
}

export interface TextArea extends BaseField{
  type: 'text-area'  
  value:string | undefined
}

export interface DateField extends BaseField{
  type: 'date'  
  value:string | undefined
}

export interface ColorField extends BaseField{
  type: 'color'  
  value: string | undefined
}

export interface SelectField extends BaseField{
  type: 'select'  
  value: string | undefined
  options: string[]
}