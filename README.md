# Dart Model Tester (DMT)

![DMT Logo](media/dmt-100.png)

**Dart Model Tester** is a VS Code extension that allows you to validate JSON data against your Dart model classes **directly from a convenient sidebar UI**. No need to run commands manually or leave VS Code—everything is interactive and real-time.

---

## **Features**

- 🟢 Validate JSON against any Dart model class
- 🟢 Support for `json_serializable` annotated models
- 🟢 Interactive UI with:
  - JSON input box (paste JSON or load from file)
  - Dart model file picker
  - Class name input
- 🟢 Instantly see parsing results in the sidebar
- 🟢 Works with any Flutter/Dart project in your workspace
- 🟢 Lightweight and fast — no extra dependencies outside Dart SDK

---

## **Usage**

1. After installing, you will see a **Dart JSON** icon in the **Activity Bar** (left sidebar).
2. Click the icon to open the **Validator** view.
3. Paste your JSON in the **JSON Input** box.
4. Select your **Dart model file** using the file picker.
5. Enter the **Class Name** of the model to validate against.
6. Click **Run Validation**.

- ✅ If parsing succeeds, you will see a **SUCCESS** message.
- ⚠️ If there are errors:
  - Entire Tack Trace will be displayed.

---

## **Notes**

- The extension uses **Dart SDK** installed in your system.
- Ensure your project can run Dart files (i.e., it’s a proper Dart/Flutter project with models accessible).
- Works with both plain Dart classes and `json_serializable` annotated models.

---




