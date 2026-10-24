import { configureStore, createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { api, errorMessage } from './api'
import type { User } from './types'

export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try { return (await api.get<{ user: User }>('/user/me')).data.user }
  catch (error) { return rejectWithValue(errorMessage(error)) }
})
const auth = createSlice({
  name: 'auth', initialState: { user: null as User | null, ready: false },
  reducers: { setUser(state, action: PayloadAction<User | null>) { state.user = action.payload; state.ready = true } },
  extraReducers: builder => builder
    .addCase(restoreSession.fulfilled, (state, action) => { state.user = action.payload; state.ready = true })
    .addCase(restoreSession.rejected, state => { state.user = null; state.ready = true }),
})
export const { setUser } = auth.actions
export const store = configureStore({ reducer: { auth: auth.reducer } })
export const useAppDispatch: () => typeof store.dispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<ReturnType<typeof store.getState>> = useSelector
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.endsWith('/login')) store.dispatch(setUser(null))
  return Promise.reject(error)
})
