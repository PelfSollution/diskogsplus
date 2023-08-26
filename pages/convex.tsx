import { useQuery } from "convex/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { api } from "../convex/_generated/api";

export default function Convex() {
  const tasks = useQuery(api.tasks.get);
  return (
    <Layout>
    <main className="flex min-h-screen flex-col items-center p-24">
      {tasks?.map(({ _id, text }) => (
        <div key={_id.toString()}>{text}</div>
      ))}
    </main>
    </Layout>
  );
}