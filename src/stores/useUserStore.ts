import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface UserInfo {
  name: string;
  nameId?: string;
  bio?: string;
  bioId?: string;
  avatar?: string;
  avatarId?: string;
  background?: string;
  backgroundId?: string;
  chatpubkey?: string;
  avatarLocalUri?: string;
  metaid?: string;
}

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (userInfo: UserInfo) => void;
  updateUserField: <K extends keyof UserInfo>(
    key: K,
    value: UserInfo[K]
  ) => void;
  clearUserInfo: () => void;
}

const useUserStore = create(
  persist<UserState>(
    (set) => ({
      userInfo: null,

      // 一次性设置完整 userInfo
      setUserInfo: (userInfo) => set({ userInfo }),

      // 更新单个字段（userInfo 不存在时会自动初始化）
      updateUserField: (key, value) =>
        set((state) => ({
          userInfo: {
            ...(state.userInfo ?? { name: "" }), // 保证至少有一个 name 字段
            [key]: value,
          },
        })),

      // 清空 userInfo
      clearUserInfo: () => set({ userInfo: null }),
    }),
    {
      name: "userInfo", // 存储 key
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useUserStore;
