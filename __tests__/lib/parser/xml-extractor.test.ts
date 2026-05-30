import { extractDocument, extractStyles } from '@/lib/parser/xml-extractor'

describe('xml-extractor', () => {
  const sampleDocumentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:pStyle w:val="Normal"/></w:pPr>
      <w:r><w:t>Hello world</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Chapter 1</w:t></w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838" w:orient="portrait"/>
      <w:pgMar w:top="1440" w:right="1800" w:bottom="1440" w:left="1800"/>
    </w:sectPr>
  </w:body>
</w:document>`

  test('extracts paragraphs from document.xml', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.paragraphs.length).toBe(2)
    expect(doc.paragraphs[0].text).toBe('Hello world')
    expect(doc.paragraphs[1].text).toBe('Chapter 1')
  })

  test('extracts page setup from sectPr', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.pageSetup.width).toBe(11906)
    expect(doc.pageSetup.height).toBe(16838)
    expect(doc.pageSetup.orientation).toBe('portrait')
    expect(doc.pageSetup.marginTop).toBe(1440)
    expect(doc.pageSetup.marginRight).toBe(1800)
  })

  test('extracts heading style id', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.paragraphs[0].styleId).toBe('Normal')
    expect(doc.paragraphs[1].styleId).toBe('Heading1')
  })

  const sampleStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="宋体"/><w:sz w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:rPr><w:rFonts w:ascii="Arial" w:eastAsia="黑体"/><w:sz w:val="32"/></w:rPr>
  </w:style>
</w:styles>`

  test('extracts styles from styles.xml', () => {
    const styles = extractStyles(sampleStylesXml)
    expect(styles.has('Normal')).toBe(true)
    expect(styles.has('Heading1')).toBe(true)
    const h1 = styles.get('Heading1')!
    expect(h1.basedOn).toBe('Normal')
  })

  test('default page setup fallback when sectPr is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Hello</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
    const doc = extractDocument(xml)
    expect(doc.pageSetup.width).toBe(11906)
    expect(doc.pageSetup.height).toBe(16838)
    expect(doc.pageSetup.orientation).toBe('portrait')
    expect(doc.pageSetup.marginTop).toBe(1440)
    expect(doc.pageSetup.marginRight).toBe(1440)
    expect(doc.pageSetup.marginBottom).toBe(1440)
    expect(doc.pageSetup.marginLeft).toBe(1440)
  })

  test('defaultStyles is { pPr: null, rPr: null } when docDefaults is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Hello</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
    const doc = extractDocument(xml)
    expect(doc.defaultStyles).toEqual({ pPr: null, rPr: null })
  })

  test('paragraph with multiple runs concatenates text', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Hello </w:t></w:r>
      <w:r><w:t>world</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
    const doc = extractDocument(xml)
    expect(doc.paragraphs.length).toBe(1)
    expect(doc.paragraphs[0].text).toBe('Hello world')
  })

  test('outline level extraction', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:outlineLvl w:val="1"/></w:pPr>
      <w:r><w:t>Section</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`
    const doc = extractDocument(xml)
    expect(doc.paragraphs[0].outlineLvl).toBe(1)
  })

  test('isDefault attribute is parsed correctly', () => {
    const styles = extractStyles(sampleStylesXml)
    const normal = styles.get('Normal')!
    expect(normal.isDefault).toBe(true)
    const h1 = styles.get('Heading1')!
    expect(h1.isDefault).toBe(false)
  })

  test('complete margin assertions in existing page setup', () => {
    const doc = extractDocument(sampleDocumentXml)
    expect(doc.pageSetup.marginTop).toBe(1440)
    expect(doc.pageSetup.marginRight).toBe(1800)
    expect(doc.pageSetup.marginBottom).toBe(1440)
    expect(doc.pageSetup.marginLeft).toBe(1800)
  })

  test('empty styles XML returns empty Map', () => {
    const styles = extractStyles('')
    expect(styles).toBeInstanceOf(Map)
    expect(styles.size).toBe(0)
  })
})
