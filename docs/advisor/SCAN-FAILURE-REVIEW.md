# advisor-preview scan failure — 2026-10-12

Confirmed: useAdvisor swallowed every native rejection into the same generic message. Photo display alone does not establish successful detector execution. The correct build profile is advisor-preview, as confirmed by the tester. No connected ADB device was available during this review.

The JS fix classifies whitelisted native codes, logs only stage/code under BBookAdvisorFailure, and checks analyze as well as normalization/guard functions for native availability. It never prints raw errors, image paths, geometry or personal data. There is no automatic retry. No native guard, detector lifecycle, dependency or backend change.

E_ADVISOR_LIMIT covers the two-attempt session budget and memory safety guard. E_DETECTION covers detector failure/cancellation and memory checks after detector stages. E_INPUT covers invalid normalized input and detector initialization. These broad native codes cannot determine the precise device cause without scalar stage logs. Memory is a hypothesis, not a confirmed cause of this screenshot.

Next: reconnect ADB Wireless and export existing scalar logs without another inference:

```powershell
Set-Location D:\EXE\bbeauty-app-mlkit-advisor
.\docs\advisor\Export-AdvisorMemory.ps1 -Serial 'ACTUAL_ADB_SERIAL'
```

Do not disable memory limits or repeatedly restart to bypass them. No Render/backend deployment is needed for local face detection. Existing installed preview APK does not receive this JS fix by Metro reload: it needs a new advisor-preview build by the tester. No APK build was performed for this change. Scan success and repeated-inference stability remain unverified.
