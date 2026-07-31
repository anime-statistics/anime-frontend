export interface INoteAttachment {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
  url: string
}

export interface INote {
  id: string
  mediaId: string
  content: string
  attachments: INoteAttachment[]
  createdAt: string
  updatedAt: string
}
