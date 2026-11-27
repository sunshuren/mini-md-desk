using System;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Globalization;
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

    [DllImport("user32.dll")] private static extern bool RegisterHotKey(IntPtr hwnd, int id, uint mods, uint key);
    [DllImport("user32.dll")] private static extern bool UnregisterHotKey(IntPtr hwnd, int id);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr hwnd);
    private const int ShortcutId = 1;
    private readonly NotifyIcon tray = new NotifyIcon();
    private bool registered, quitting;
    private string shortcut;
    [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
    private static extern int SetCurrentProcessExplicitAppUserModelID(string id);
    private static readonly bool Chinese = CultureInfo.CurrentUICulture.TwoLetterISOLanguageName == "zh";

    private void Reveal()
    {
        Show();
        WindowState = FormWindowState.Normal;
        SetForegroundWindow(Handle);
        Activate();
        view.Focus();
    }

    private void Quit() { quitting = true; Close(); }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        if (!quitting && e.CloseReason == CloseReason.UserClosing) {
            e.Cancel = true;
            Hide();
        }
        base.OnFormClosing(e);
    }

    protected override void OnHandleDestroyed(EventArgs args)
    {
        if (registered) { UnregisterHotKey(Handle, ShortcutId); registered = false; }
        base.OnHandleDestroyed(args);
    }

    protected override void WndProc(ref Message message)
    {
        if (message.Msg == 0x0312 && message.WParam.ToInt32() == ShortcutId) { Reveal(); return; }
        base.WndProc(ref message);
    }

    protected override void OnHandleCreated(EventArgs args)
    {
        base.OnHandleCreated(args);
        registered = RegisterHotKey(Handle, ShortcutId, 0x4003, 0x20);
        shortcut = "Ctrl + Alt + Space";
        if (!registered) {
            registered = RegisterHotKey(Handle, ShortcutId, 0x4003, 0x4D);
            shortcut = "Ctrl + Alt + M";
        }
        int disabled = 1; // DWMNCRP_DISABLED
        int square = 1;   // DWMWCP_DONOTROUND
        int noColor = -2; // DWMWA_COLOR_NONE
        DwmSetWindowAttribute(Handle, 2, ref disabled, sizeof(int));
        DwmSetWindowAttribute(Handle, 33, ref square, sizeof(int));
        DwmSetWindowAttribute(Handle, 34, ref noColor, sizeof(int));
    }

    private ClipWindow()
    {
        Text = Chinese ? "AI 剪贴板" : "AI Clipboard";
        var menu = new ContextMenuStrip();
        menu.Items.Add(Chinese ? "打开 AI 剪贴板" : "Show AI Clipboard", null, (s,e) => Reveal());
        menu.Items.Add(Chinese ? "退出" : "Quit", null, (s,e) => Quit());
        tray.ContextMenuStrip = menu;
        var iconStream = Assembly.GetExecutingAssembly().GetManifestResourceStream("feather.ico");
        Icon = new Icon(iconStream);
        var smallIcon = new Icon(Icon, SystemInformation.SmallIconSize);
        tray.Icon = smallIcon;
        tray.Text = Text;
        tray.MouseClick += (s,e) => { if (e.Button == MouseButtons.Left) Reveal(); };
        tray.Visible = true;
        FormClosed += (s,e) => { tray.Visible = false; tray.Dispose(); menu.Dispose(); smallIcon.Dispose(); iconStream.Dispose(); };
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
                    if (action == "quit") Quit();
                    else if (action == "hide") Hide();
                    else if (action == "hotkey-status") core.PostWebMessageAsString(registered ? shortcut : "shortcut-unavailable");
                    else if (action == "minimize") WindowState = FormWindowState.Minimized;
                    else if (action == "drag" || action == "resize") {
                        ReleaseCapture();
                        SendMessage(Handle, 0xA1, (IntPtr)(action == "drag" ? 2 : 17), IntPtr.Zero);
                    }
                };
                core.Navigate(page);
            } catch (Exception ex) { MessageBox.Show((Chinese ? "请检查 Microsoft Edge WebView2 Runtime。" : "Check the Microsoft Edge WebView2 Runtime.") + "\n" + ex.Message, Text); Quit(); }
        };
    }

    [STAThread]
    private static void Main() {
        SetCurrentProcessExplicitAppUserModelID("Sunshuren.AIClipboard");
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        bool first;
        using (var wake = new EventWaitHandle(false, EventResetMode.AutoReset, @"Local\Sunshuren.AIClipboard.Wake", out first)) {
            if (!first) { wake.Set(); return; }
            using (var window = new ClipWindow()) {
                var handle = window.Handle;
                var listener = ThreadPool.RegisterWaitForSingleObject(wake, (state,timedOut) => {
                    try { window.BeginInvoke((Action)window.Reveal); }
                    catch (InvalidOperationException) { }
                }, null, Timeout.Infinite, false);
                try { Application.Run(window); }
                finally { listener.Unregister(null); }
            }
        }
    }
}

