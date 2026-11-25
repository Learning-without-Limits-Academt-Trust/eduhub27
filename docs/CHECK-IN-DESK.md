# EduHub 2027 registration: check-in desk and name badges

## Before the day

1. **Email everyone their ticket.** In admin, go to Overview, then **Email everyone their ticket**, and press **Email all tickets**. Keep the page open until it finishes (about 25 emails a minute). Any that could not be sent are listed.
2. **Print the welcome poster.** In admin, go to Overview, then **Print the welcome poster**. Print it on A4, in colour if possible, and put copies at the entrance and along the way to registration. Its QR code opens the sign-in page (`/eduhub/find/`), where people enter their surname and booking email address.

## Equipment for each desk

- A laptop with Google Chrome.
- A **label printer**, for example a Brother QL-800 or QL-820NWB, with 62 mm continuous labels. Any printer works, but a label printer is fastest.
- A **USB or Bluetooth QR scanner** that can read phone screens (a "2D" or "CMOS" scanner). It acts like a keyboard: it types the ticket link and presses Enter.

## Printing badges without a print window (kiosk printing)

Chrome normally shows a print window. To print straight to the default printer:

1. Set the label printer as the laptop's **default printer**, with the label size chosen in its printer settings.
2. Close Chrome completely.
3. Make a desktop shortcut to Chrome and add ` --kiosk-printing` to the end of its **Target** (Windows: right-click the shortcut, Properties). For example:
   `"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk-printing`
4. Open Chrome from that shortcut, sign in to the Learning Hub admin, and open **Check-in desk** (`/admin/desk/`).
5. Under **Badge settings**, choose the badge size that matches your labels.

Do a test the day before: scan a ticket, check the badge prints, then use **Undo check-in** from the ticket's admin view if needed.

## On the day

- **Arriving now:** as soon as someone scans the welcome poster and signs in on their phone, their name appears at the top of the check-in desk screen, usually within five seconds. Click their name to check them in and print their badge. "Not here" removes a name without checking them in. Names drop off after four hours.
- **Scan a ticket:** click in the "Scan a ticket" box, then scan the QR code on the person's phone or printout. The screen goes green and the badge prints.
  - Amber means they were already checked in. Press **Print badge again** if they need a new badge.
  - Red means the booking was cancelled.
  - Amber with **Check in anyway** means they are on the waiting list.
- **No ticket?** Type the first letters of their surname under "No ticket? Search by surname", then press **Check in and print**.
- **Phones as a back-up:** any phone signed in to admin can scan a ticket with its camera and check the person in. Badges then need printing from the desk.

## What a badge shows

Name, school or role (governor, trustee or speaker), and their workshops with times and rooms. It never shows dietary, allergy or accessibility details.

## Data protection

The desk shows names and schools of everyone booked, and must only be used on a Trust device signed in to admin. **Find my booking** only shows a ticket when both the surname and the booking email address match, and it never says which one was wrong. Please record your Data Protection Officer's approval before the day.
