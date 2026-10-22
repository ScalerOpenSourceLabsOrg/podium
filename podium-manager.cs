using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

namespace PodiumManager
{
    class Program
    {
        static string projectDir = @"D:\podium";

        static string GetDockerExe()
        {
            // Check PATH first
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("docker", "--version");
                psi.UseShellExecute = false;
                psi.RedirectStandardOutput = true;
                psi.CreateNoWindow = true;
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(2000);
                    if (p.ExitCode == 0) return "docker";
                }
            }
            catch { }

            // Check standard LocalAppData install
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string dockerLocal = Path.Combine(localApp, @"Programs\DockerDesktop\resources\bin\docker.exe");
            if (File.Exists(dockerLocal))
            {
                return dockerLocal;
            }

            // Check standard Program Files install
            string progFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string dockerPF = Path.Combine(progFiles, @"Docker\Docker\resources\bin\docker.exe");
            if (File.Exists(dockerPF))
            {
                return dockerPF;
            }

            return "docker";
        }

        static void RunProcess(string filename, string arguments, bool waitForExit)
        {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = filename;
            psi.Arguments = arguments;
            psi.WorkingDirectory = projectDir;
            psi.UseShellExecute = false;

            // Inject Docker bin into PATH if found in local app data
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string dockerBin = Path.Combine(localApp, @"Programs\DockerDesktop\resources\bin");
            if (Directory.Exists(dockerBin))
            {
                string existingPath = Environment.GetEnvironmentVariable("PATH") ?? "";
                if (!existingPath.Contains(dockerBin))
                {
                    psi.EnvironmentVariables["PATH"] = dockerBin + ";" + existingPath;
                }
            }

            using (Process process = Process.Start(psi))
            {
                if (waitForExit && process != null)
                {
                    process.WaitForExit();
                }
            }
        }

        static void Setup()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("==================================================");
            Console.WriteLine("           PODIUM // INITIAL SETUP");
            Console.WriteLine("==================================================");
            Console.ResetColor();
            Console.WriteLine();

            string docker = GetDockerExe();

            // 1. Check/create .env
            string envFile = Path.Combine(projectDir, ".env");
            string envExample = Path.Combine(projectDir, ".env.example");
            if (!File.Exists(envFile) && File.Exists(envExample))
            {
                Console.WriteLine("[1/5] Creating .env from .env.example...");
                File.Copy(envExample, envFile);
            }
            else
            {
                Console.WriteLine("[1/5] .env file verified.");
            }

            // 2. npm install
            Console.WriteLine("[2/5] Checking / installing npm packages...");
            RunProcess("cmd.exe", "/c npm install", true);

            // 3. Start DB
            Console.WriteLine("[3/5] Starting PostgreSQL database (Docker)...");
            RunProcess("cmd.exe", string.Format("/c \"\"{0}\" compose up -d db\"", docker), true);
            Console.WriteLine("Waiting 4 seconds for PostgreSQL to be ready...");
            Thread.Sleep(4000);

            // 4. Migrations
            Console.WriteLine("[4/5] Running Prisma database migrations...");
            RunProcess("cmd.exe", "/c npx prisma migrate dev --name init", true);

            // 5. Seed
            Console.WriteLine("[5/5] Seeding sample event (HackDay 26)...");
            RunProcess("cmd.exe", "/c npm run seed", true);

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\n[SUCCESS] Setup complete! You can now choose option 2 to start Podium.");
            Console.ResetColor();
            Console.WriteLine("\nPress any key to return to menu...");
            Console.ReadKey();
        }

        static void Start()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("==================================================");
            Console.WriteLine("           PODIUM // STARTING APPLICATION");
            Console.WriteLine("==================================================");
            Console.ResetColor();
            Console.WriteLine();

            string docker = GetDockerExe();

            // Ensure DB is running
            Console.WriteLine("[1/2] Ensuring PostgreSQL container is running...");
            RunProcess("cmd.exe", string.Format("/c \"\"{0}\" compose up -d db\"", docker), true);

            Console.WriteLine("[2/2] Launching dev server in a new window...");
            
            // Launch npm run dev in a new cmd window
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "cmd.exe";
            psi.Arguments = "/c title Podium Dev Server && npm run dev";
            psi.WorkingDirectory = projectDir;
            psi.UseShellExecute = true;
            Process.Start(psi);

            Console.WriteLine("\nServer is starting up on http://localhost:3000");
            Console.WriteLine("Opening browser in 5 seconds...");
            Thread.Sleep(5000);

            try
            {
                Process.Start("http://localhost:3000");
            }
            catch { }

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("\nDev credentials:");
            Console.WriteLine("  Organizer:   organizer@podium.test");
            Console.WriteLine("  Judge:       judge1@podium.test");
            Console.WriteLine("  Participant: registrant1@podium.test");
            Console.ResetColor();
            Console.WriteLine("\nPress any key to return to menu...");
            Console.ReadKey();
        }

        static void Stop()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("==================================================");
            Console.WriteLine("           PODIUM // STOPPING APPLICATION");
            Console.WriteLine("==================================================");
            Console.ResetColor();
            Console.WriteLine();

            string docker = GetDockerExe();

            Console.WriteLine("[1/2] Stopping Next.js dev server on port 3000...");
            RunProcess("cmd.exe", "/c for /f \"tokens=5\" %a in ('netstat -aon ^| findstr \":3000\" ^| findstr \"LISTENING\"') do taskkill /f /pid %a >nul 2>&1", true);

            Console.WriteLine("[2/2] Stopping PostgreSQL container...");
            RunProcess("cmd.exe", string.Format("/c \"\"{0}\" compose stop db\"", docker), true);

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\n[SUCCESS] Podium processes stopped.");
            Console.ResetColor();
            Console.WriteLine("\nPress any key to return to menu...");
            Console.ReadKey();
        }

        static void Seed()
        {
            Console.Clear();
            Console.WriteLine("Re-seeding database...");
            RunProcess("cmd.exe", "/c npm run seed", true);
            Console.WriteLine("\nDone. Press any key to return to menu...");
            Console.ReadKey();
        }

        static void Main(string[] args)
        {
            // Allow command line execution e.g. podium.exe setup / podium.exe start / podium.exe stop
            if (args.Length > 0)
            {
                string cmd = args[0].ToLower().Trim();
                if (cmd == "setup") { Setup(); return; }
                if (cmd == "start" || cmd == "run") { Start(); return; }
                if (cmd == "stop") { Stop(); return; }
                if (cmd == "seed") { Seed(); return; }
            }

            while (true)
            {
                Console.Clear();
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("==================================================");
                Console.WriteLine("           PODIUM HACKATHON CONTROLLER            ");
                Console.WriteLine("==================================================");
                Console.ResetColor();
                Console.WriteLine("  [1] Setup Podium (Docker DB + Migrations + Seed)");
                Console.WriteLine("  [2] Start Podium (Run DB + Dev Server + Browser)");
                Console.WriteLine("  [3] Stop Podium (Kill Dev Server + Stop DB)");
                Console.WriteLine("  [4] Re-seed Demo Data (HackDay 26)");
                Console.WriteLine("  [5] Open in Browser (http://localhost:3000)");
                Console.WriteLine("  [6] Exit");
                Console.WriteLine("==================================================");
                Console.Write("  Select an option [1-6]: ");

                string choice = Console.ReadLine();
                if (choice == "1") Setup();
                else if (choice == "2") Start();
                else if (choice == "3") Stop();
                else if (choice == "4") Seed();
                else if (choice == "5")
                {
                    try { Process.Start("http://localhost:3000"); } catch { }
                }
                else if (choice == "6") break;
            }
        }
    }
}
