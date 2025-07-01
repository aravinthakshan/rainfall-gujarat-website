import { spawn } from "child_process"
import { join } from "path"

export async function processCSVData(csvPath: string, date: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonScript = join(process.cwd(), "scripts", "process-csv.py")

    const pythonProcess = spawn("python3", [pythonScript, csvPath, date])

    let output = ""
    let errorOutput = ""

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString()
      console.log("Python output:", data.toString())
    })

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString()
      console.error("Python error:", data.toString())
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        console.log("CSV processing completed successfully")
        resolve()
      } else {
        console.error("CSV processing failed with code:", code)
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`))
      }
    })

    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error)
      reject(error)
    })
  })
}
