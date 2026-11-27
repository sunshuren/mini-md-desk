using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

internal static class Launcher
{
    [STAThread]
    private static void Main()
    {
        try
        {
            string edge = FindEdge();
            if (edge == null) throw new FileNotFoundException("请安装 Microsoft Edge，或从发布页下载 HTML 版。");
            string folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MiniMdDesk");
            Directory.CreateDirectory(folder);
            string page = Path.Combine(folder, "editor.html");
            string temp = Path.Combine(folder, Guid.NewGuid().ToString() + ".tmp");
            using (Stream input = Assembly.GetExecutingAssembly().GetManifestResourceStream("editor.html"))
            using (FileStream output = File.Create(temp)) input.CopyTo(output);
            try {
                if (File.Exists(page)) File.Replace(temp, page, null);
                else File.Move(temp, page);
            } finally { if (File.Exists(temp)) File.Delete(temp); }
            string profile = Path.Combine(folder, "profile");
            string args = "--user-data-dir=\"" + profile + "\" --no-first-run --app=\"" + new Uri(page).AbsoluteUri + "\"";
            Process.Start(new ProcessStartInfo(edge, args) { UseShellExecute = false });
        }
        catch (Exception error) { MessageBox.Show(error.Message, "极简 MD"); }
    }

    private static string FindEdge()
    {
        foreach (Environment.SpecialFolder root in new[] { Environment.SpecialFolder.ProgramFilesX86, Environment.SpecialFolder.ProgramFiles, Environment.SpecialFolder.LocalApplicationData }) {
            string path = Path.Combine(Environment.GetFolderPath(root), @"Microsoft\Edge\Application\msedge.exe");
            if (File.Exists(path)) return path;
        }
        return null;
    }
}

