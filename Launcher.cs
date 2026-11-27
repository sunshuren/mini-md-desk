using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Windows.Forms;

internal static class Launcher
{
    [STAThread]
    private static void Main() {
        try {
            var assembly = Assembly.GetExecutingAssembly();
            var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MiniMdDesk", "app");
            Directory.CreateDirectory(root);
            var folder = Path.Combine(root, assembly.ManifestModule.ModuleVersionId.ToString());
            if (!Directory.Exists(folder)) {
                var temp = Directory.CreateDirectory(Path.Combine(root, Guid.NewGuid().ToString())).FullName;
                foreach (string file in assembly.GetManifestResourceNames()) {
                    using (var input = assembly.GetManifestResourceStream(file))
                    using (var output = File.Create(Path.Combine(temp, file))) input.CopyTo(output);
                }
                try { Directory.Move(temp, folder); }
                catch (IOException) { if (!Directory.Exists(folder)) throw; Directory.Delete(temp, true); }
            }
            Process.Start(Path.Combine(folder, "ClipWindow.exe"));
        } catch (Exception error) { MessageBox.Show(error.Message, "AI Clipboard"); }
    }
}

