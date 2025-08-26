import { create } from "zustand";


type User = { id: number; name: string; email: string; role: string };


type AuthState = {
user: User | null;
token: string | null;
login: (token: string, user: User) => void;
logout: () => void;
};


export const useAuth = create<AuthState>((set) => ({
user: null,
token: null,
login: (token, user) => {
localStorage.setItem("access_token", token);
set({ token, user });
},
logout: () => {
localStorage.removeItem("access_token");
set({ token: null, user: null });
window.location.href = "/auth/login";
},
}));