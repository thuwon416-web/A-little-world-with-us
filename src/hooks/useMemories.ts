import { useQuery } from '@tanstack/react-query'
import { memoriesService } from '@/services/memories'

export function useMemories(coupleId: string) {
  return useQuery({
    queryKey: ['memories', coupleId],
    queryFn: () => memoriesService.getByCouple(coupleId),
    enabled: !!coupleId,
  })
}
