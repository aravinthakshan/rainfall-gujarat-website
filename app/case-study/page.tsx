import React from "react"
import Image from "next/image"

export default function CaseStudyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
    <h1 className="text-3xl font-bold text-center mb-6 whitespace-normal">
    Saurashtra Submerged <br /> A Wake-Up Call from the June 2025 Floods 
    </h1>
      
      <p className="mb-4">
        Between June 16 and 17, 2025, the Saurashtra region of Gujarat faced extreme monsoon rainfall, triggering one of the season's earliest and most severe flood events (Figure 1). Meteorological data confirms that several districts, including Botad, Amreli, and Bhavnagar, were inundated by relentless downpours, with some talukas recording over 300 mm of rain in just 48 hours. Talukas like Sihor, Umrala, Botad, and Gadhada reported 358, 386, 418, and 387 mm of rainfall, which was more than 50% of their mean annual rainfall.
      </p>

      {/* Figure 1 */}
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

      {/* Figure 2 */}
      <div className="mb-6">
        <div className="w-full rounded mb-2 overflow-hidden">
          <Image
            src="Rainfall.png"
            alt="Daily rainfall across various talukas"
            width={800}
            height={600}
            className="w-full h-auto"
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">Figure 2. Daily rainfall across various talukas of Bhavnagar, Botad, and Amreli</p>
      </div>

      <p className="mb-4">
        Satellite and ground-based flood maps reveal the scale of devastation. Vast swathes of Saurashtra were submerged, with the most severe flooding observed along river basins and low-lying agricultural lands. The Sentinel-1 SAR images depict the upstream and downstream of the Shetrunji Dam before and after the heavy rainfall event of June 2025 (Figure 3 and Figure 4). The pre-flood image shows normal surface conditions, while the post-flood image (17 June 2025) highlights flooded areas in blue, detected using radar-based change analysis.
      </p>

      {/* Figure 3 */}
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
        <p className="text-center text-sm text-muted-foreground">Figure 3. Pre-flood SAR image</p>
      </div>

      {/* Figure 4 */}
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
        <p className="text-center text-sm text-muted-foreground">Figure 4. Post-flood SAR image</p>
      </div>

      <p className="mb-4">
        Between 16–17 June, Shetrunji Dam experienced a significant rise in water storage following intense monsoon rainfall. Almost no rainfall occurred until 16 June, after which cumulative rainfall surged, rapidly filling the reservoir. By 17 June evening, storage neared 94% capacity (Figure 5). Inflow peaked at over 3500 m³/s, while outflow remained negligible until a controlled release began late on 17 June. This event highlights how short bursts of heavy rain can quickly transform reservoir conditions, underscoring the importance of real-time monitoring and timely water management to balance flood control and storage needs.
      </p>

      {/* Figure 5 */}
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
        <p className="text-center text-sm text-muted-foreground">Figure 5. Reservoir dynamics at Shetrunji dam</p>
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
