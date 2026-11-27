using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal sealed class ClipWindow : Form
{
    [DllImport("user32.dll")] private static extern bool ReleaseCapture();
    [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hwnd, int msg, IntPtr w, IntPtr l);
    private readonly WebView2 view = new WebView2();

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

    protected override void OnHandleCreated(EventArgs args)
    {
        base.OnHandleCreated(args);
        int disabled = 1; // DWMNCRP_DISABLED
        int square = 1;   // DWMWCP_DONOTROUND
        int noColor = -2; // DWMWA_COLOR_NONE
        DwmSetWindowAttribute(Handle, 2, ref disabled, sizeof(int));
        DwmSetWindowAttribute(Handle, 33, ref square, sizeof(int));
        DwmSetWindowAttribute(Handle, 34, ref noColor, sizeof(int));
    }

    private ClipWindow()
    {
        Text = "极简 MD";
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.CenterScreen;
        Size = new Size(680, 450);
        MinimumSize = new Size(280, 150);
        AutoScaleMode = AutoScaleMode.Dpi;
        BackColor = Color.FromArgb(245, 242, 233);
        view.DefaultBackgroundColor = BackColor;
        view.Dock = DockStyle.Fill;
        Controls.Add(view);
        Shown += async (sender, args) => {
            try {
                string cache = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "MiniMdDesk", "webview");
                var env = await CoreWebView2Environment.CreateAsync(null, cache);
                await view.EnsureCoreWebView2Async(env);
                var core = view.CoreWebView2;
                const string page = "https://minimd.local/editor.html";
                core.SetVirtualHostNameToFolderMapping("minimd.local", AppDomain.CurrentDomain.BaseDirectory, CoreWebView2HostResourceAccessKind.Deny);
                core.NavigationStarting += (s,e) => { if (e.Uri != page) e.Cancel = true; };
                core.NewWindowRequested += (s,e) => e.Handled = true;
                core.PermissionRequested += (s,e) => {
                    if (e.Uri.StartsWith("https://minimd.local/") && e.PermissionKind == CoreWebView2PermissionKind.ClipboardRead && e.IsUserInitiated)
                        e.State = CoreWebView2PermissionState.Allow;
                };
                core.WebMessageReceived += (s,e) => {
                    if (e.Source != page) return;
                    string action = e.TryGetWebMessageAsString();
                    if (action == "close") Close();
                    else if (action == "minimize") WindowState = FormWindowState.Minimized;
                    else if (action == "drag" || action == "resize") {
                        ReleaseCapture();
                        SendMessage(Handle, 0xA1, (IntPtr)(action == "drag" ? 2 : 17), IntPtr.Zero);
                    }
                };
                core.Navigate(page);
            } catch (Exception ex) { MessageBox.Show("无法启动编辑器。请检查 Microsoft Edge WebView2 Runtime。\n" + ex.Message, Text); Close(); }
        };
    }

    [STAThread]
    private static void Main() {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new ClipWindow());
    }
}

