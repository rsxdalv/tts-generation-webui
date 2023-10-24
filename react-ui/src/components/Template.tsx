import React from "react";
import { FavoritesProvider } from "./FavoritesProvider";
import { LocalVotesProvider, VotesProvider } from "@/components/VotesProvider";
import { Header } from "./Header";
import { inter } from "../pages/generations";

export const Template = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>
    <LocalVotesProvider>
      <VotesProvider>
        <main
          className={`flex min-h-screen flex-col items-center justify-between p-12 space-y-4 ${inter.className}`}
        >
          <Header />
          {children}
        </main>
      </VotesProvider>
    </LocalVotesProvider>
  </FavoritesProvider>
);
