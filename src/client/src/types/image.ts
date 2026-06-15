export interface ImageDto {
  id: string
  repoTags: string[]
  size: number
  created: string
  dangling: boolean
  labels: Record<string, string>
}

export interface PullImageRequest {
  image: string
  tag?: string
}

export interface TagImageRequest {
  repository: string
  tag: string
}
