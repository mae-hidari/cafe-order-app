"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface UserIdentityProps {
  onUserSet: (userId: string, nickname: string, animal: string) => void;
}

const animals = [
  "🐶 いぬ", "🐱 ねこ", "🐰 うさぎ", "🐻 くま", "🐼 パンダ", "🐯 とら", 
  "🦁 ライオン", "🐸 かえる", "🐧 ペンギン", "🐺 おおかみ", "🦊 きつね", 
  "🐹 ハムスター", "🐨 コアラ", "🐒 さる", "🐘 ぞう", "🦒 きりん"
];

export default function UserIdentity({ onUserSet }: UserIdentityProps) {
  const [nickname, setNickname] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSubmit = () => {
    if (!nickname.trim()) {
      toast.error("ニックネームを入力してください");
      return;
    }
    
    if (!selectedAnimal) {
      toast.error("好きな動物を選択してください");
      return;
    }

    const userId = `${nickname.trim()}_${selectedAnimal.split(" ")[1]}`;
    
    // 管理者フラグをローカルストレージに保存
    localStorage.setItem('cafe-is-admin', isAdmin.toString());
    
    onUserSet(userId, nickname.trim(), selectedAnimal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ☕ Private Cafe
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ニックネームと好きな動物を選んでください
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ニックネーム
            </label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-field"
              placeholder="あなたのニックネーム"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              好きな動物
            </label>
            <div className="grid grid-cols-4 gap-2">
              {animals.map((animal) => (
                <button
                  key={animal}
                  onClick={() => setSelectedAnimal(animal)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedAnimal === animal
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-600 hover:border-blue-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{animal.split(" ")[0]}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {animal.split(" ")[1]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                🛠️ 管理者として利用する
              </span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            className="btn-primary w-full"
            disabled={!nickname.trim() || !selectedAnimal}
          >
            カフェを利用する
          </button>
        </div>
      </div>
    </div>
  );
}