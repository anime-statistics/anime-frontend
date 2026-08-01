export type ITagColor = `#${string}`

export interface ITag {
  id: string
  name: string
  color: ITagColor
  icon?: string
  isHidden: boolean
  // Seeded watch statuses: renameable and recolourable, but not deletable.
  isSystem: boolean
  sortOrder: number
  groupId?: string
}

export interface ITagGroup {
  id: string
  name: string
  sortOrder: number
  tagIds: string[]
}
