"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SHEET_API_URL = "https://sheets.googleapis.com/v4/spreadsheets/1q8KX7jqpW4T9hdX-2OUDt7Pkk5eYOYNVbbCzIP7mDA8/values/Sheet1?key=AIzaSyDE5T0BBW-v-l3-XvWYm2p_G9Vgl0YP6Jk";

function parseSheetData(values: string[][]) {
  if (!values || values.length < 2) return [];
  const headers = values[0].map(h => h.trim().toLowerCase());
  return values.slice(1)
    .filter(row => row.length > 0 && row.some(cell => cell.trim() !== ""))
    .map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header] = row[i] || "";
      });
      return obj;
    });
}

export default function BlogPage() {
  const [posts, setPosts] = useState<Array<Record<string, string>>>([]);
  const [error, setError] = useState<string | null>(null);

  // Saurashtra Floods blog post (always first)
  const saurashtraFloodsPost = {
    title: "Saurashtra Submerged A Wake-Up Call from the June 2025 Floods",
    "image source": "/Rainfall_map.jpg", // Use an appropriate image from public/
    "link to source": "/blog/saurashtra-floods-2025",
    internal: true,
  };

  useEffect(() => {
    fetch(SHEET_API_URL)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch blog posts");
        return res.json();
      })
      .then(data => setPosts(parseSheetData(data.values)))
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">Insights and stories from the Water & Climate Lab</p>
        </div>
      </div>
      <main className="w-full px-4 py-12">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {/* Tiling grid layout for blog posts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Saurashtra Floods blog tile (internal link) */}
          <Link
            href={saurashtraFloodsPost["link to source"]}
            className="group block"
          >
            <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-white min-w-[340px]">
              <div className="relative h-64 bg-gray-100">
                <Image
                  src={saurashtraFloodsPost["image source"]}
                  alt={saurashtraFloodsPost["title"]}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                  {saurashtraFloodsPost["title"]}
                </h2>
              </div>
            </div>
          </Link>
          {/* Google Sheets blog posts */}
          {posts
            .filter(post => post["title"] && post["image source"] && post["link to source"])
            .map((post: Record<string, string>, idx: number) => (
              <a
                key={idx}
                href={post["link to source"]}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-white min-w-[340px]">
                  <div className="relative h-64 bg-gray-100">
                    <Image
                      src={post["image source"] || "/placeholder.jpg"}
                      alt={post["title"]}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-center">
                      {post["title"]}
                    </h2>
                  </div>
                </div>
              </a>
            ))}
        </div>
      </main>
    </div>
  );
} 

// this doesnt look good, need to fix it