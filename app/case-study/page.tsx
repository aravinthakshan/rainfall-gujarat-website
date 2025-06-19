import React from "react"
import Image from "next/image"

export default function CaseStudyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Saurashtra Submerged: A Wake-Up Call from the June 2025 Floods</h1>
      <p className="mb-4">
        Between June 16 and 17, 2025, the Saurashtra region of Gujarat faced extreme monsoon rainfall, triggering one of the season's earliest and most severe flood events (Figure 1). Meteorological data confirms that several districts, including Botad, Amreli, and Bhavnagar, were inundated by relentless downpours, with some talukas recording over 300 mm of rain in just 48 hours. Talukas like Sihor, Umrala, Botad, and Gadhada reported 358, 386, 418, and 387 mm of rainfall (Table 1) in these two days which was more than 50% of mean annual rainfall.
      </p>
      <div className="mb-6">
        <div className="w-full rounded mb-2 overflow-hidden">
          <Image
            src="/Rainfall_map.jpg"
            alt="Map of Saurashtra flood event"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Figure 1. Map of Saurashtra flood event</p>
      </div>
      {/* <h2 className="text-xl font-semibold mb-2">Table 1. Daily rainfall across various talukas of Bhavnagar, Botad, and Amreli</h2> */}
      <div className="overflow-x-auto mb-6">
        {/* <table className="min-w-full border text-sm">
    <thead>
        <tr className="bg-gray-100 dark:bg-gray-800">
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">District</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Taluka</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">till_13_june</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">14_june</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">15_june</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">16_june</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">17_june</th>
        <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Total Rainfall (mm)</th>
        </tr>
    </thead>
    <tbody>
        <tr><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">Bhavnagar</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">Bhavnagar</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">0</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">3</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">14</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">88</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">40</td><td className="border border-gray-300 dark:border-gray-600 px-2 py-1">145</td></tr>
        <tr><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Gariadhar</td><td className="border px-2 py-1">5</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">4</td><td className="border px-2 py-1">150</td><td className="border px-2 py-1">12</td><td className="border px-2 py-1">171</td></tr>
        <tr><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Ghogha</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">24</td><td className="border px-2 py-1">61</td><td className="border px-2 py-1">16</td><td className="border px-2 py-1">101</td></tr>
        <tr><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Jesar</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">3</td><td className="border px-2 py-1">272</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">275</td></tr>
        <tr><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Mahuva (Bhavnagar)</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">18</td><td className="border px-2 py-1">229</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">247</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Palitana</td><td className="border px-2 py-1">5</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">18</td><td className="border px-2 py-1">301</td><td className="border px-2 py-1">4</td><td className="border px-2 py-1 font-bold">328</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Sihor</td><td className="border px-2 py-1">9</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">79</td><td className="border px-2 py-1">294</td><td className="border px-2 py-1">64</td><td className="border px-2 py-1 font-bold">446</td></tr>
        <tr><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Talaja</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">155</td><td className="border px-2 py-1">4</td><td className="border px-2 py-1">159</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Umrala</td><td className="border px-2 py-1">2</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">7</td><td className="border px-2 py-1">265</td><td className="border px-2 py-1">121</td><td className="border px-2 py-1 font-bold">395</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Bhavnagar</td><td className="border px-2 py-1">Vallabhipur</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">49</td><td className="border px-2 py-1">160</td><td className="border px-2 py-1">115</td><td className="border px-2 py-1 font-bold">324</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Botad</td><td className="border px-2 py-1">Botad</td><td className="border px-2 py-1">20</td><td className="border px-2 py-1">36</td><td className="border px-2 py-1">6</td><td className="border px-2 py-1">280</td><td className="border px-2 py-1">138</td><td className="border px-2 py-1 font-bold">480</td></tr>
        <tr><td className="border px-2 py-1">Botad</td><td className="border px-2 py-1">Barwala</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">33</td><td className="border px-2 py-1">7</td><td className="border px-2 py-1">65</td><td className="border px-2 py-1">191</td><td className="border px-2 py-1">296</td></tr>
        <tr className="bg-red-100"><td className="border px-2 py-1">Botad</td><td className="border px-2 py-1">Gadhada</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">2</td><td className="border px-2 py-1">352</td><td className="border px-2 py-1">35</td><td className="border px-2 py-1 font-bold">389</td></tr>
        <tr><td className="border px-2 py-1">Botad</td><td className="border px-2 py-1">Ranpur</td><td className="border px-2 py-1">3</td><td className="border px-2 py-1">8</td><td className="border px-2 py-1">7</td><td className="border px-2 py-1">42</td><td className="border px-2 py-1">91</td><td className="border px-2 py-1">151</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">8</td><td className="border px-2 py-1">9</td><td className="border px-2 py-1">172</td><td className="border px-2 py-1">6</td><td className="border px-2 py-1">195</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Babra</td><td className="border px-2 py-1">54</td><td className="border px-2 py-1">17</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">121</td><td className="border px-2 py-1">3</td><td className="border px-2 py-1">195</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Bagasara</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">5</td><td className="border px-2 py-1">4</td><td className="border px-2 py-1">65</td><td className="border px-2 py-1">2</td><td className="border px-2 py-1">76</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Dhari</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">1</td><td className="border px-2 py-1">1</td><td className="border px-2 py-1">48</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">50</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Jafrabad</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">4</td><td className="border px-2 py-1">43</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">47</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Khambha</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">65</td><td className="border px-2 py-1">103</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">168</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Lathi</td><td className="border px-2 py-1">9</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">82</td><td className="border px-2 py-1">24</td><td className="border px-2 py-1">115</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Lilia</td><td className="border px-2 py-1">5</td><td className="border px-2 py-1">2</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">171</td><td className="border px-2 py-1">20</td><td className="border px-2 py-1">198</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Rajula</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">18</td><td className="border px-2 py-1">188</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">206</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Savarkundla</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">17</td><td className="border px-2 py-1">254</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">271</td></tr>
        <tr><td className="border px-2 py-1">Amreli</td><td className="border px-2 py-1">Kunkavav Vadia</td><td className="border px-2 py-1">32</td><td className="border px-2 py-1">9</td><td className="border px-2 py-1">6</td><td className="border px-2 py-1">70</td><td className="border px-2 py-1">0</td><td className="border px-2 py-1">117</td></tr>
    </tbody>
    </table> */}
      </div>
      <p className="mb-4">
        Satellite and ground-based flood maps reveal the scale of devastation. Vast swathes of Saurashtra were submerged, with the most severe flooding observed along river basins and low-lying agricultural lands. The sentinel-1 SAR images depict the upstream and downstream of the Shetrunji Dam before and after the heavy rainfall event of June 2025 (Figure 2 and Figure 3). The pre-flood image shows normal surface conditions, while the post-flood image (17-June-2025) highlights flooded areas in blue, detected using radar-based change analysis.
      </p>
      <div className="mb-6">
        <div className="w-full rounded mb-2 overflow-hidden">
          <Image
            src="/Before.PNG"
            alt="Pre-flood SAR image"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Figure 2. Pre-flood SAR image</p>
      </div>
      <div className="mb-6">
        <div className="w-full rounded mb-2 overflow-hidden">
          <Image
            src="/After.PNG"
            alt="Post-flood SAR image"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Figure 3. Post-flood SAR image</p>
      </div>
      <p className="mb-4">
        Between 16–17 June, Shetrunji Dam experienced a significant rise in water storage following intense monsoon rainfall. Almost no rainfall occurred until 16 June, after which cumulative rainfall surged, rapidly filling the reservoir. By 17 June evening, storage neared 94% capacity (Figure 4). Inflow peaked at over 3500 m³/s, while outflow remained negligible until a controlled release began late on 17 June. This event highlights how short bursts of heavy rain can quickly transform reservoir conditions, underscoring the importance of real-time monitoring and timely water management to balance flood control and storage needs.
      </p>
      <div className="mb-6">
        <div className="w-full rounded mb-2 overflow-hidden">
          <Image
            src="/Flood_animation.gif"
            alt="Reservoir dynamics at Shetrunji dam"
            width={800}
            height={600}
            className="w-full h-auto"
            unoptimized
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Figure 4. Reservoir dynamics at Shetrunji dam</p>
      </div>
      <p className="mb-4">
        The June 2025 floods in Saurashtra are a stark reminder of the region's vulnerability to extreme weather events. As climate variability intensifies, Gujarat must prioritize early warning systems, resilient infrastructure, and coordinated disaster response to safeguard lives and livelihoods.
      </p>
      <div className="mt-8 text-right">
        <p className="font-semibold">Written by:</p>
        <p>Hiren Solanki<br />PhD Scholar, Earth Sciences, IIT Gandhinagar.</p>
      </div>
    </div>
  )
}