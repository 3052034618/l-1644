import type { DatasetDelivery, Task } from '@/types'

export type DeliveryFormat = 'json' | 'csv' | 'xml'

export const buildSampleCSV = (tasks: Task[]): string => {
  const rows: string[][] = [['task_id', 'data_id', 'content', 'annotation_json', 'accuracy']]
  tasks.forEach((t) => {
    t.dataItems.forEach((d) => {
      rows.push([
        t.id,
        d.id,
        String(d.content ?? '').replace(/\r?\n/g, ' '),
        JSON.stringify(d.annotation ?? {}),
        t.accuracyRate != null ? String(t.accuracyRate) : '',
      ])
    })
  })
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export const buildDeliveryFile = (
  fmt: DeliveryFormat,
  tasks: Task[]
): { content: string; mime: string; ext: string } => {
  const approved = tasks.filter((t) => t.status === 'approved')
  const data = approved.flatMap((t) =>
    t.dataItems.map((d) => ({
      taskId: t.id,
      dataId: d.id,
      content: d.content,
      annotation: d.annotation ?? {},
      accuracy: t.accuracyRate,
    }))
  )
  if (fmt === 'json') {
    return { content: JSON.stringify(data, null, 2), mime: 'application/json', ext: 'json' }
  }
  if (fmt === 'xml') {
    const body = data
      .map(
        (item) =>
          `  <record><taskId>${item.taskId}</taskId><dataId>${item.dataId}</dataId><content><![CDATA[${String(
            item.content ?? ''
          ).replace(/\]\]>/g, '')}]]></content><annotation>${JSON.stringify(
            item.annotation
          )}</annotation><accuracy>${item.accuracy ?? ''}</accuracy></record>`
      )
      .join('\n')
    return {
      content: `<?xml version="1.0" encoding="UTF-8"?>\n<dataset>\n${body}\n</dataset>`,
      mime: 'application/xml',
      ext: 'xml',
    }
  }
  return { content: buildSampleCSV(approved), mime: 'text/csv', ext: 'csv' }
}

export const triggerDownload = (
  content: string,
  mime: string,
  filename: string
): void => {
  const blob = new Blob(['\uFEFF' + content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const buildDeliveryRecord = (
  format: DeliveryFormat,
  tasks: Task[],
  generatedBy = '系统'
): DatasetDelivery & { fileContent: string; mime: string; ext: string } => {
  const approvedTasks = tasks.filter((t) => t.status === 'approved')
  const { content, mime, ext } = buildDeliveryFile(format, tasks)
  const sizeKB = Math.max(1, Math.round(new Blob([content]).size / 1024))
  const dataCount = approvedTasks.reduce((sum, t) => sum + t.dataItems.length, 0)
  return {
    id: `dlv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    format,
    dataCount,
    generatedAt: new Date().toISOString(),
    generatedBy,
    fileSizeKB: sizeKB,
    fileContent: content,
    mime,
    ext,
  }
}

export const formatBytes = (kb: number): string => {
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}
