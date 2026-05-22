import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isLoading: false })
  })

  it('should start with null user and token', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.token).toBeNull()
  })

  it('should set credentials correctly', () => {
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', isHousehead: false, canViewHousehold: true, household: { id: 1, name: 'Test Home' } } as any
    
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    
    const state = useAuthStore.getState()
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should logout correctly', () => {
    // Setup
    const mockUser = { id: 1, email: 'test@example.com', name: 'Test User', isHousehead: false, canViewHousehold: true, household: { id: 1, name: 'Test Home' } } as any
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    
    // Act
    useAuthStore.getState().logout()
    
    // Assert
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
