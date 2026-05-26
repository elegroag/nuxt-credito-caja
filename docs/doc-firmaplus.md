# FirmaPlus API

## Generar Solicitud De Firma

**Endpoint** https://firmaplus.co/FirmaPlusPruebas/api/signer

## Request

```json
{
  "Usuario": "xxxxxx",
  "Clave": "xxxxxx",
  "Nota": "xxxxxx xxxx xxxxx",
  "Firmantes": [
    {
      "Identificacion": "123456789",
      "TipoIdentificacion": "Cédula de ciudadania",
      "Nombre": "Camilo Andres Diaz Rodriguez",
      "Correo": "jxxxxxxx@gmail.com",
      "NroCelular": "573045240000",
      "Foto": "0",
      "FotoObligatoria": "0",
      "SolicitarAdjunto": "0",
      "ReconocimientoFacial": "0"
    }
  ],
  "ArchivosPDF": [
    {
      "Nombre": "Certificado",
      "Documento_base64": "JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA"
    }
  ],
  "ArchivosAdjuntos": [
    {
      "NombreDocumento": "Documento Adjunto",
      "Documento": "JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA"
    }
  ]
}
```

## Response

```json
{
  "Code": "1",
  "Data": {
    "NroSolicitud": "1001",
    "Fecha": "09/12/2021 10:14:29",
    "Link": "http://localhost/FirmaPlus/xxxxxx"
  },
  "Message": "Documentos y registros guardados."
}
```

## Procesar Solicitud Con Captura De Datos

**Endpoint** [](https://firmaplus.co/FirmaPlusPruebas/api/generarsolicitud)

## Request

```json
{
  "Usuario": "xxxxxx",
  "Clave": "xxxxxx",
  "Nota": "xxxxxx xxxx xxxxx",
  "Firmantes": [
    {
      "Identificacion": "123456789",
      "TipoIdentificacion": "Cédula de ciudadania",
      "Nombre": "Camilo Andres Diaz Rodriguez",
      "Correo": "jxxxxxxx@gmail.com",
      "NroCelular": "573045240000",
      "FotoBase64": "/9j/4AAQSkZJRgABAgAAAQABAAD//gARTGF2YzU3LjEwNy4xMDAA/",
      "CodigoOTP": "000000",
      "FechaHoraEnvioOTP": "2024-12-31 15:47:44",
      "FechaHoraConfirmacionOTP": "2024-12-31 15:47:44",
      "TerminosCondiciones": 1,
      "TratamientoDatos": 1,
      "Grafo": "/9j/4AAQSkZJRgABAgAAAQABAAD//gARTGF2YzU3LjEwNy4xMDAA/"
    }
  ],
  "ArchivosPDF": [
    {
      "Nombre": "Certificado",
      "Documento_base64": "JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA"
    }
  ],
  "ArchivosAdjuntos": [
    {
      "NombreDocumento": "Documento Adjunto",
      "Documento": "JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA JVBERi0xLjUNCiW1tbW1 DQoxIDAgb2JbrqDQo 8PC9UeXBlL0 NhdGFsb2cvUGFnZXMgMiA"
    }
  ],
  "Template": 0
}
```

## Response

```json
{
  "Code": "1",
  "Data": {
    "NroSolicitud": "1001",
    "Fecha": "09/12/2021 10:14:29"
  },
  "Message": "Documentos y registros guardados."
}
```
