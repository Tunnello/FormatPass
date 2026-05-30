import JSZip from 'jszip'

export interface DocxFiles {
  documentXml: string
  stylesXml?: string
}

export async function unzipDocx(arrayBuffer: ArrayBuffer): Promise<DocxFiles> {
  const zip = await JSZip.loadAsync(arrayBuffer)

  const documentXml = await zip.file('word/document.xml')?.async('string')
  const stylesXml = await zip.file('word/styles.xml')?.async('string')

  if (!documentXml) {
    throw new Error('无法找到 word/document.xml，文件可能损坏或不是标准 docx 格式')
  }

  return { documentXml, stylesXml }
}
