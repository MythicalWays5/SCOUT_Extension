# 🛡️ S.C.O.U.T. Roblox (v1.52)

**S.C.O.U.T. Roblox** is a lightweight, community-driven Chrome Extension designed to help keep Roblox players safe. It automatically scans Roblox profiles and user lists (Friends, Followers, Following) to detect if an account is associated with known NSFW/ERP (Erotic Roleplay) groups. This extension is a part of the S.C.O.U.T. autonomous safety ecosystem.

Made by the community, for the community. Stay safe.
---

## ✨ Features
* **Main Profile Scanning:** Instantly displays a safety rating badge directly beneath a user's name on their main profile page.
* **Mass List Scanning:** Seamlessly integrates safety badges into paginated lists (Friends, Followers, Following) without breaking Roblox's UI.
* **RoPro & Extension Compatible:** Built using a "Zero-Touch DOM" method, S.C.O.U.T. has options to disable its user list badges if at all other extensions like RoPro or RoGold clash with it.
* **Auto-Update Notifications:** You will never be left behind. S.C.O.U.T. will notify you via a desktop notification and an in-page Roblox banner whenever a new security update is ready.
* **Terminated Friends count:** On the main profile page of a user, you will see the number of terminated friends of the user.
* **Group Scanner:** On group/community main page and search page, this extension will flag detected groups.
* **Dangerous User Warning:** On the profile page of the user, you may get an exclamation warning beside the safety badge if the user has been logged dangerous by the S.C.O.U.T. autonomous system. This is irrespective of the count of flagged groups.
* **[NEW] Threat Report Pop Ups:** Interacting with the exclamation mark on profiles, or opening a flagged profile will now give a "report" like pop up which states how the user was detected by the S.C.O.U.T. systems. Auto-pop ups can be disabled in the settings.
* **[NEW] Utility Tool**: Right clicking on something gives you an option to copy its ID, supports Users, Groups, Games & Assets.

---
---
## 🛠️ Fixes (v1.5)
* **Group Scanner**: The "Safe" badge from the group page has been removed. This is to avoid possible confusion between an actual "safe" group and a potentially unchecked dangerous group. Always excercise caution before joining new groups.
* **Expanded Dangerous User flag**: The SCOUT Autonomous System will now flag user lists. Its display setting is merged with "User List Badges".
* Updated the way extension settings are saved. It should be more robust and reliable.
---

## 🔒 Privacy & Safety Guarantee
We understand that installing browser extensions requires trust. **S.C.O.U.T. is built with a strict privacy-first architecture:**

1. **Zero Personal Data Collection:** The extension does **not** track your browsing history, read your messages, or access your passwords. It only reads the public Roblox User IDs visible on the screen.
2. **No Authentication Access:** S.C.O.U.T. does not touch or require your `.ROBLOSECURITY` cookie. 
3. **100% Local Processing:** Unlike other extensions that send your data to external servers, S.C.O.U.T. downloads a public list of flagged groups to your computer's memory. All cross-referencing and math is done **locally inside your own browser**.
4. **Open Source:** Every line of code is completely public in this repository. You can verify exactly what it does before installing it.

---

## ⚙️ How to Install (Chrome/Edge/Brave/OperaGX)

Because S.C.O.U.T. is not currently on the Chrome Web Store, you will need to install it manually using Developer Mode. It takes less than 60 seconds!

1. **Download the Extension:** Click the green **`Code`** button at the top of this repository and select **`Download ZIP`**.
2. **Extract the Folder:** Find the downloaded `.zip` file on your computer, right-click it, and select **Extract All**. Remember where you saved this extracted folder.
3. **Open Extension Settings:** Open Chrome and type `chrome://extensions/` into your URL bar and hit Enter.
4. **Enable Developer Mode:** In the top-right corner of the Extensions page, toggle **Developer mode** to ON.
5. **Load the Extension:** Click the **Load unpacked** button in the top-left corner. Select the extracted `SCOUT_Extension-main` folder. 
6. **Done!** You should now see the S.C.O.U.T. logo in your extensions list. Refresh any open Roblox tabs to start using it.

---

## 🔄 How to Update

When a new version of S.C.O.U.T. is released, you will see a red **Update Ready!** banner appear on your Roblox page or inside the extension's popup menu.

1. Click the **Get Update** button on the banner. This will automatically download the newest `.zip` file to your computer.
2. Delete your old S.C.O.U.T. folder and Extract the new `.zip` folder in its place.
3. Go back to `chrome://extensions/`.
4. Find S.C.O.U.T. in your list and click the circular **Reload** arrow icon on its card.
5. Refresh your Roblox page. You are now running the latest version!

---

## 🛠️ Settings & Toggles
If you ever want to temporarily disable the badges, simply click the S.C.O.U.T. puzzle piece icon in your browser's top-right toolbar. You can toggle the Main Profile Badges and the User List Badges on and off independently—no page refresh required!