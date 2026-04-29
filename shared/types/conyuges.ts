export interface ConyugeResponse {
  success: boolean
  exception: number
  data: ConyugeData[]
}

export interface ConyugeData {
  cedcon: string
  coddoc: string
  priape: string
  segape: string
  prinom: string
  segnom: string
  direccion: string
  telefono: string
  email: string
  codzon: string
  codcaj: string | null
  codocu: string
  nivedu: string
  captra: string
  salario: number
  tipsal: string
  fecsal: string
  tippag: string
  codcue: string
  ofides: string
  codgru: string
  codban: string
  numcue: string
  tipcue: string
  sexo: string
  estciv: string
  fecnac: string
  ciunac: string
  estado: string
  fecest: string | null
  numtar: string
  giass: string
  usuario: string
  fecact: string
  nombre: string
  cedtra: string
  comper: string
  fecafi: string
}