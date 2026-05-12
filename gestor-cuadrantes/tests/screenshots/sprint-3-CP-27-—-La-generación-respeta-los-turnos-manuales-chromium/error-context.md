# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sprint-3.spec.ts >> CP-27 — La generación respeta los turnos manuales
- Location: tests/e2e/sprint-3.spec.ts:111:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect.toBeVisible: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "Gestor de Cuadrantes" [level=1] [ref=e5]
        - navigation [ref=e6]:
          - link "Proyectos" [ref=e7] [cursor=pointer]:
            - /url: /projects
          - link "Cuadrante" [ref=e8] [cursor=pointer]:
            - /url: /
          - link "Empleados" [ref=e9] [cursor=pointer]:
            - /url: /employees
          - link "Ayuda" [ref=e10] [cursor=pointer]:
            - /url: /info
      - generic [ref=e11]:
        - generic [ref=e12]: 📁 Equipo Soporte 24h
        - generic [ref=e13]: admin@cuadrantes.localSUPER_ADMIN
        - button "Cerrar sesión" [ref=e14]
    - main [ref=e15]:
      - generic [ref=e16]:
        - button "‹" [ref=e17]
        - heading "Septiembre 2026" [level=2] [ref=e18]
        - button "›" [ref=e19]
        - generic [ref=e20]: Modo edición — clic en celda para asignar turno
        - button "Generar cuadrante" [ref=e21]
        - button "Exportar CSV" [ref=e22]
        - button "Imprimir" [ref=e23]
        - button "Festivos" [ref=e24]
      - table [ref=e26]:
        - rowgroup [ref=e27]:
          - row "Empleado 1 M 2 X 3 J 4 V 5 S 6 D 7 L 8 M 9 X 10 J 11 V 12 S 13 D 14 L 15 M 16 X 17 J 18 V 19 S 20 D 21 L 22 M 23 X 24 J 25 V 26 S 27 D 28 L 29 M 30 X Contadores" [ref=e28]:
            - columnheader "Empleado" [ref=e29]
            - columnheader "1 M" [ref=e30]:
              - generic [ref=e31]: "1"
              - generic [ref=e32]: M
            - columnheader "2 X" [ref=e33]:
              - generic [ref=e34]: "2"
              - generic [ref=e35]: X
            - columnheader "3 J" [ref=e36]:
              - generic [ref=e37]: "3"
              - generic [ref=e38]: J
            - columnheader "4 V" [ref=e39]:
              - generic [ref=e40]: "4"
              - generic [ref=e41]: V
            - columnheader "5 S" [ref=e42]:
              - generic [ref=e43]: "5"
              - generic [ref=e44]: S
            - columnheader "6 D" [ref=e45]:
              - generic [ref=e46]: "6"
              - generic [ref=e47]: D
            - columnheader "7 L" [ref=e48]:
              - generic [ref=e49]: "7"
              - generic [ref=e50]: L
            - columnheader "8 M" [ref=e51]:
              - generic [ref=e52]: "8"
              - generic [ref=e53]: M
            - columnheader "9 X" [ref=e54]:
              - generic [ref=e55]: "9"
              - generic [ref=e56]: X
            - columnheader "10 J" [ref=e57]:
              - generic [ref=e58]: "10"
              - generic [ref=e59]: J
            - columnheader "11 V" [ref=e60]:
              - generic [ref=e61]: "11"
              - generic [ref=e62]: V
            - columnheader "12 S" [ref=e63]:
              - generic [ref=e64]: "12"
              - generic [ref=e65]: S
            - columnheader "13 D" [ref=e66]:
              - generic [ref=e67]: "13"
              - generic [ref=e68]: D
            - columnheader "14 L" [ref=e69]:
              - generic [ref=e70]: "14"
              - generic [ref=e71]: L
            - columnheader "15 M" [ref=e72]:
              - generic [ref=e73]: "15"
              - generic [ref=e74]: M
            - columnheader "16 X" [ref=e75]:
              - generic [ref=e76]: "16"
              - generic [ref=e77]: X
            - columnheader "17 J" [ref=e78]:
              - generic [ref=e79]: "17"
              - generic [ref=e80]: J
            - columnheader "18 V" [ref=e81]:
              - generic [ref=e82]: "18"
              - generic [ref=e83]: V
            - columnheader "19 S" [ref=e84]:
              - generic [ref=e85]: "19"
              - generic [ref=e86]: S
            - columnheader "20 D" [ref=e87]:
              - generic [ref=e88]: "20"
              - generic [ref=e89]: D
            - columnheader "21 L" [ref=e90]:
              - generic [ref=e91]: "21"
              - generic [ref=e92]: L
            - columnheader "22 M" [ref=e93]:
              - generic [ref=e94]: "22"
              - generic [ref=e95]: M
            - columnheader "23 X" [ref=e96]:
              - generic [ref=e97]: "23"
              - generic [ref=e98]: X
            - columnheader "24 J" [ref=e99]:
              - generic [ref=e100]: "24"
              - generic [ref=e101]: J
            - columnheader "25 V" [ref=e102]:
              - generic [ref=e103]: "25"
              - generic [ref=e104]: V
            - columnheader "26 S" [ref=e105]:
              - generic [ref=e106]: "26"
              - generic [ref=e107]: S
            - columnheader "27 D" [ref=e108]:
              - generic [ref=e109]: "27"
              - generic [ref=e110]: D
            - columnheader "28 L" [ref=e111]:
              - generic [ref=e112]: "28"
              - generic [ref=e113]: L
            - columnheader "29 M" [ref=e114]:
              - generic [ref=e115]: "29"
              - generic [ref=e116]: M
            - columnheader "30 X" [ref=e117]:
              - generic [ref=e118]: "30"
              - generic [ref=e119]: X
            - columnheader "Contadores" [ref=e120]
        - rowgroup [ref=e121]:
          - row "Tecnico Editado 1778585593703 V M B M MF MF T T T T T D TF M M M M M D MF T T T T T D TF M M M M:10 T:10 MF:3 TF:2 D:3 V:1 B:1" [ref=e122]:
            - cell "Tecnico Editado 1778585593703" [ref=e123]
            - cell "V" [ref=e124] [cursor=pointer]:
              - generic "Vacaciones" [ref=e125]: V
            - cell "M" [ref=e126] [cursor=pointer]:
              - generic "Mañana" [ref=e127]: M
            - cell "B" [ref=e128] [cursor=pointer]:
              - generic "Baja" [ref=e129]: B
            - cell "M" [ref=e130] [cursor=pointer]:
              - generic "Mañana" [ref=e131]: M
            - cell "MF" [ref=e132] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e133]: MF
            - cell "MF" [ref=e134] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e135]: MF
            - cell "T" [ref=e136] [cursor=pointer]:
              - generic "Tarde" [ref=e137]: T
            - cell "T" [ref=e138] [cursor=pointer]:
              - generic "Tarde" [ref=e139]: T
            - cell "T" [ref=e140] [cursor=pointer]:
              - generic "Tarde" [ref=e141]: T
            - cell "T" [ref=e142] [cursor=pointer]:
              - generic "Tarde" [ref=e143]: T
            - cell "T" [ref=e144] [cursor=pointer]:
              - generic "Tarde" [ref=e145]: T
            - cell "D" [ref=e146] [cursor=pointer]:
              - generic "Descanso" [ref=e147]: D
            - cell "TF" [ref=e148] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e149]: TF
            - cell "M" [ref=e150] [cursor=pointer]:
              - generic "Mañana" [ref=e151]: M
            - cell "M" [ref=e152] [cursor=pointer]:
              - generic "Mañana" [ref=e153]: M
            - cell "M" [ref=e154] [cursor=pointer]:
              - generic "Mañana" [ref=e155]: M
            - cell "M" [ref=e156] [cursor=pointer]:
              - generic "Mañana" [ref=e157]: M
            - cell "M" [ref=e158] [cursor=pointer]:
              - generic "Mañana" [ref=e159]: M
            - cell "D" [ref=e160] [cursor=pointer]:
              - generic "Descanso" [ref=e161]: D
            - cell "MF" [ref=e162] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e163]: MF
            - cell "T" [ref=e164] [cursor=pointer]:
              - generic "Tarde" [ref=e165]: T
            - cell "T" [ref=e166] [cursor=pointer]:
              - generic "Tarde" [ref=e167]: T
            - cell "T" [ref=e168] [cursor=pointer]:
              - generic "Tarde" [ref=e169]: T
            - cell "T" [ref=e170] [cursor=pointer]:
              - generic "Tarde" [ref=e171]: T
            - cell "T" [ref=e172] [cursor=pointer]:
              - generic "Tarde" [ref=e173]: T
            - cell "D" [ref=e174] [cursor=pointer]:
              - generic "Descanso" [ref=e175]: D
            - cell "TF" [ref=e176] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e177]: TF
            - cell "M" [ref=e178] [cursor=pointer]:
              - generic "Mañana" [ref=e179]: M
            - cell "M" [ref=e180] [cursor=pointer]:
              - generic "Mañana" [ref=e181]: M
            - cell "M" [ref=e182] [cursor=pointer]:
              - generic "Mañana" [ref=e183]: M
            - cell "M:10 T:10 MF:3 TF:2 D:3 V:1 B:1" [ref=e184]:
              - generic [ref=e185]:
                - generic [ref=e186]: M:10
                - generic [ref=e187]: T:10
                - generic [ref=e188]: MF:3
                - generic [ref=e189]: TF:2
                - generic [ref=e190]: D:3
                - generic [ref=e191]: V:1
                - generic [ref=e192]: B:1
          - row "Técnico 1 M T M T TF TF M M M M M D MF T T T T T D TF M M M M M D MF T T T M:12 T:10 MF:2 TF:3 D:3" [ref=e193]:
            - cell "Técnico 1" [ref=e194]
            - cell "M" [ref=e195] [cursor=pointer]:
              - generic "Mañana" [ref=e196]: M
            - cell "T" [ref=e197] [cursor=pointer]:
              - generic "Tarde" [ref=e198]: T
            - cell "M" [ref=e199] [cursor=pointer]:
              - generic "Mañana" [ref=e200]: M
            - cell "T" [ref=e201] [cursor=pointer]:
              - generic "Tarde" [ref=e202]: T
            - cell "TF" [ref=e203] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e204]: TF
            - cell "TF" [ref=e205] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e206]: TF
            - cell "M" [ref=e207] [cursor=pointer]:
              - generic "Mañana" [ref=e208]: M
            - cell "M" [ref=e209] [cursor=pointer]:
              - generic "Mañana" [ref=e210]: M
            - cell "M" [ref=e211] [cursor=pointer]:
              - generic "Mañana" [ref=e212]: M
            - cell "M" [ref=e213] [cursor=pointer]:
              - generic "Mañana" [ref=e214]: M
            - cell "M" [ref=e215] [cursor=pointer]:
              - generic "Mañana" [ref=e216]: M
            - cell "D" [ref=e217] [cursor=pointer]:
              - generic "Descanso" [ref=e218]: D
            - cell "MF" [ref=e219] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e220]: MF
            - cell "T" [ref=e221] [cursor=pointer]:
              - generic "Tarde" [ref=e222]: T
            - cell "T" [ref=e223] [cursor=pointer]:
              - generic "Tarde" [ref=e224]: T
            - cell "T" [ref=e225] [cursor=pointer]:
              - generic "Tarde" [ref=e226]: T
            - cell "T" [ref=e227] [cursor=pointer]:
              - generic "Tarde" [ref=e228]: T
            - cell "T" [ref=e229] [cursor=pointer]:
              - generic "Tarde" [ref=e230]: T
            - cell "D" [ref=e231] [cursor=pointer]:
              - generic "Descanso" [ref=e232]: D
            - cell "TF" [ref=e233] [cursor=pointer]:
              - generic "Tarde Finde" [ref=e234]: TF
            - cell "M" [ref=e235] [cursor=pointer]:
              - generic "Mañana" [ref=e236]: M
            - cell "M" [ref=e237] [cursor=pointer]:
              - generic "Mañana" [ref=e238]: M
            - cell "M" [ref=e239] [cursor=pointer]:
              - generic "Mañana" [ref=e240]: M
            - cell "M" [ref=e241] [cursor=pointer]:
              - generic "Mañana" [ref=e242]: M
            - cell "M" [ref=e243] [cursor=pointer]:
              - generic "Mañana" [ref=e244]: M
            - cell "D" [ref=e245] [cursor=pointer]:
              - generic "Descanso" [ref=e246]: D
            - cell "MF" [ref=e247] [cursor=pointer]:
              - generic "Mañana Finde" [ref=e248]: MF
            - cell "T" [ref=e249] [cursor=pointer]:
              - generic "Tarde" [ref=e250]: T
            - cell "T" [ref=e251] [cursor=pointer]:
              - generic "Tarde" [ref=e252]: T
            - cell "T" [ref=e253] [cursor=pointer]:
              - generic "Tarde" [ref=e254]: T
            - cell "M:12 T:10 MF:2 TF:3 D:3" [ref=e255]:
              - generic [ref=e256]:
                - generic [ref=e257]: M:12
                - generic [ref=e258]: T:10
                - generic [ref=e259]: MF:2
                - generic [ref=e260]: TF:3
                - generic [ref=e261]: D:3
          - row "Técnico 2 T T T T D D M M M M M D D T T T T T D D M M M M M D D T T T M:10 T:12 D:8" [ref=e262]:
            - cell "Técnico 2" [ref=e263]
            - cell "T" [ref=e264] [cursor=pointer]:
              - generic "Tarde" [ref=e265]: T
            - cell "T" [ref=e266] [cursor=pointer]:
              - generic "Tarde" [ref=e267]: T
            - cell "T" [ref=e268] [cursor=pointer]:
              - generic "Tarde" [ref=e269]: T
            - cell "T" [ref=e270] [cursor=pointer]:
              - generic "Tarde" [ref=e271]: T
            - cell "D" [ref=e272] [cursor=pointer]:
              - generic "Descanso" [ref=e273]: D
            - cell "D" [ref=e274] [cursor=pointer]:
              - generic "Descanso" [ref=e275]: D
            - cell "M" [ref=e276] [cursor=pointer]:
              - generic "Mañana" [ref=e277]: M
            - cell "M" [ref=e278] [cursor=pointer]:
              - generic "Mañana" [ref=e279]: M
            - cell "M" [ref=e280] [cursor=pointer]:
              - generic "Mañana" [ref=e281]: M
            - cell "M" [ref=e282] [cursor=pointer]:
              - generic "Mañana" [ref=e283]: M
            - cell "M" [ref=e284] [cursor=pointer]:
              - generic "Mañana" [ref=e285]: M
            - cell "D" [ref=e286] [cursor=pointer]:
              - generic "Descanso" [ref=e287]: D
            - cell "D" [ref=e288] [cursor=pointer]:
              - generic "Descanso" [ref=e289]: D
            - cell "T" [ref=e290] [cursor=pointer]:
              - generic "Tarde" [ref=e291]: T
            - cell "T" [ref=e292] [cursor=pointer]:
              - generic "Tarde" [ref=e293]: T
            - cell "T" [ref=e294] [cursor=pointer]:
              - generic "Tarde" [ref=e295]: T
            - cell "T" [ref=e296] [cursor=pointer]:
              - generic "Tarde" [ref=e297]: T
            - cell "T" [ref=e298] [cursor=pointer]:
              - generic "Tarde" [ref=e299]: T
            - cell "D" [ref=e300] [cursor=pointer]:
              - generic "Descanso" [ref=e301]: D
            - cell "D" [ref=e302] [cursor=pointer]:
              - generic "Descanso" [ref=e303]: D
            - cell "M" [ref=e304] [cursor=pointer]:
              - generic "Mañana" [ref=e305]: M
            - cell "M" [ref=e306] [cursor=pointer]:
              - generic "Mañana" [ref=e307]: M
            - cell "M" [ref=e308] [cursor=pointer]:
              - generic "Mañana" [ref=e309]: M
            - cell "M" [ref=e310] [cursor=pointer]:
              - generic "Mañana" [ref=e311]: M
            - cell "M" [ref=e312] [cursor=pointer]:
              - generic "Mañana" [ref=e313]: M
            - cell "D" [ref=e314] [cursor=pointer]:
              - generic "Descanso" [ref=e315]: D
            - cell "D" [ref=e316] [cursor=pointer]:
              - generic "Descanso" [ref=e317]: D
            - cell "T" [ref=e318] [cursor=pointer]:
              - generic "Tarde" [ref=e319]: T
            - cell "T" [ref=e320] [cursor=pointer]:
              - generic "Tarde" [ref=e321]: T
            - cell "T" [ref=e322] [cursor=pointer]:
              - generic "Tarde" [ref=e323]: T
            - cell "M:10 T:12 D:8" [ref=e324]:
              - generic [ref=e325]:
                - generic [ref=e326]: M:10
                - generic [ref=e327]: T:12
                - generic [ref=e328]: D:8
          - row "Técnico 3 M M M M D D T T T T T D D M M M M M D D T T T T T D D M M M M:12 T:10 D:8" [ref=e329]:
            - cell "Técnico 3" [ref=e330]
            - cell "M" [ref=e331] [cursor=pointer]:
              - generic "Mañana" [ref=e332]: M
            - cell "M" [ref=e333] [cursor=pointer]:
              - generic "Mañana" [ref=e334]: M
            - cell "M" [ref=e335] [cursor=pointer]:
              - generic "Mañana" [ref=e336]: M
            - cell "M" [ref=e337] [cursor=pointer]:
              - generic "Mañana" [ref=e338]: M
            - cell "D" [ref=e339] [cursor=pointer]:
              - generic "Descanso" [ref=e340]: D
            - cell "D" [ref=e341] [cursor=pointer]:
              - generic "Descanso" [ref=e342]: D
            - cell "T" [ref=e343] [cursor=pointer]:
              - generic "Tarde" [ref=e344]: T
            - cell "T" [ref=e345] [cursor=pointer]:
              - generic "Tarde" [ref=e346]: T
            - cell "T" [ref=e347] [cursor=pointer]:
              - generic "Tarde" [ref=e348]: T
            - cell "T" [ref=e349] [cursor=pointer]:
              - generic "Tarde" [ref=e350]: T
            - cell "T" [ref=e351] [cursor=pointer]:
              - generic "Tarde" [ref=e352]: T
            - cell "D" [ref=e353] [cursor=pointer]:
              - generic "Descanso" [ref=e354]: D
            - cell "D" [ref=e355] [cursor=pointer]:
              - generic "Descanso" [ref=e356]: D
            - cell "M" [ref=e357] [cursor=pointer]:
              - generic "Mañana" [ref=e358]: M
            - cell "M" [ref=e359] [cursor=pointer]:
              - generic "Mañana" [ref=e360]: M
            - cell "M" [ref=e361] [cursor=pointer]:
              - generic "Mañana" [ref=e362]: M
            - cell "M" [ref=e363] [cursor=pointer]:
              - generic "Mañana" [ref=e364]: M
            - cell "M" [ref=e365] [cursor=pointer]:
              - generic "Mañana" [ref=e366]: M
            - cell "D" [ref=e367] [cursor=pointer]:
              - generic "Descanso" [ref=e368]: D
            - cell "D" [ref=e369] [cursor=pointer]:
              - generic "Descanso" [ref=e370]: D
            - cell "T" [ref=e371] [cursor=pointer]:
              - generic "Tarde" [ref=e372]: T
            - cell "T" [ref=e373] [cursor=pointer]:
              - generic "Tarde" [ref=e374]: T
            - cell "T" [ref=e375] [cursor=pointer]:
              - generic "Tarde" [ref=e376]: T
            - cell "T" [ref=e377] [cursor=pointer]:
              - generic "Tarde" [ref=e378]: T
            - cell "T" [ref=e379] [cursor=pointer]:
              - generic "Tarde" [ref=e380]: T
            - cell "D" [ref=e381] [cursor=pointer]:
              - generic "Descanso" [ref=e382]: D
            - cell "D" [ref=e383] [cursor=pointer]:
              - generic "Descanso" [ref=e384]: D
            - cell "M" [ref=e385] [cursor=pointer]:
              - generic "Mañana" [ref=e386]: M
            - cell "M" [ref=e387] [cursor=pointer]:
              - generic "Mañana" [ref=e388]: M
            - cell "M" [ref=e389] [cursor=pointer]:
              - generic "Mañana" [ref=e390]: M
            - cell "M:12 T:10 D:8" [ref=e391]:
              - generic [ref=e392]:
                - generic [ref=e393]: M:12
                - generic [ref=e394]: T:10
                - generic [ref=e395]: D:8
          - row "Técnico 4 T T T T D D M M M M M D D T T T T T D D M M M M M D D T T T M:10 T:12 D:8" [ref=e396]:
            - cell "Técnico 4" [ref=e397]
            - cell "T" [ref=e398] [cursor=pointer]:
              - generic "Tarde" [ref=e399]: T
            - cell "T" [ref=e400] [cursor=pointer]:
              - generic "Tarde" [ref=e401]: T
            - cell "T" [ref=e402] [cursor=pointer]:
              - generic "Tarde" [ref=e403]: T
            - cell "T" [ref=e404] [cursor=pointer]:
              - generic "Tarde" [ref=e405]: T
            - cell "D" [ref=e406] [cursor=pointer]:
              - generic "Descanso" [ref=e407]: D
            - cell "D" [ref=e408] [cursor=pointer]:
              - generic "Descanso" [ref=e409]: D
            - cell "M" [ref=e410] [cursor=pointer]:
              - generic "Mañana" [ref=e411]: M
            - cell "M" [ref=e412] [cursor=pointer]:
              - generic "Mañana" [ref=e413]: M
            - cell "M" [ref=e414] [cursor=pointer]:
              - generic "Mañana" [ref=e415]: M
            - cell "M" [ref=e416] [cursor=pointer]:
              - generic "Mañana" [ref=e417]: M
            - cell "M" [ref=e418] [cursor=pointer]:
              - generic "Mañana" [ref=e419]: M
            - cell "D" [ref=e420] [cursor=pointer]:
              - generic "Descanso" [ref=e421]: D
            - cell "D" [ref=e422] [cursor=pointer]:
              - generic "Descanso" [ref=e423]: D
            - cell "T" [ref=e424] [cursor=pointer]:
              - generic "Tarde" [ref=e425]: T
            - cell "T" [ref=e426] [cursor=pointer]:
              - generic "Tarde" [ref=e427]: T
            - cell "T" [ref=e428] [cursor=pointer]:
              - generic "Tarde" [ref=e429]: T
            - cell "T" [ref=e430] [cursor=pointer]:
              - generic "Tarde" [ref=e431]: T
            - cell "T" [ref=e432] [cursor=pointer]:
              - generic "Tarde" [ref=e433]: T
            - cell "D" [ref=e434] [cursor=pointer]:
              - generic "Descanso" [ref=e435]: D
            - cell "D" [ref=e436] [cursor=pointer]:
              - generic "Descanso" [ref=e437]: D
            - cell "M" [ref=e438] [cursor=pointer]:
              - generic "Mañana" [ref=e439]: M
            - cell "M" [ref=e440] [cursor=pointer]:
              - generic "Mañana" [ref=e441]: M
            - cell "M" [ref=e442] [cursor=pointer]:
              - generic "Mañana" [ref=e443]: M
            - cell "M" [ref=e444] [cursor=pointer]:
              - generic "Mañana" [ref=e445]: M
            - cell "M" [ref=e446] [cursor=pointer]:
              - generic "Mañana" [ref=e447]: M
            - cell "D" [ref=e448] [cursor=pointer]:
              - generic "Descanso" [ref=e449]: D
            - cell "D" [ref=e450] [cursor=pointer]:
              - generic "Descanso" [ref=e451]: D
            - cell "T" [ref=e452] [cursor=pointer]:
              - generic "Tarde" [ref=e453]: T
            - cell "T" [ref=e454] [cursor=pointer]:
              - generic "Tarde" [ref=e455]: T
            - cell "T" [ref=e456] [cursor=pointer]:
              - generic "Tarde" [ref=e457]: T
            - cell "M:10 T:12 D:8" [ref=e458]:
              - generic [ref=e459]:
                - generic [ref=e460]: M:10
                - generic [ref=e461]: T:12
                - generic [ref=e462]: D:8
          - row "Técnico 5 M M M M D D T T T T T D D M M M M M D D T T T T T D D M M M M:12 T:10 D:8" [ref=e463]:
            - cell "Técnico 5" [ref=e464]
            - cell "M" [ref=e465] [cursor=pointer]:
              - generic "Mañana" [ref=e466]: M
            - cell "M" [ref=e467] [cursor=pointer]:
              - generic "Mañana" [ref=e468]: M
            - cell "M" [ref=e469] [cursor=pointer]:
              - generic "Mañana" [ref=e470]: M
            - cell "M" [ref=e471] [cursor=pointer]:
              - generic "Mañana" [ref=e472]: M
            - cell "D" [ref=e473] [cursor=pointer]:
              - generic "Descanso" [ref=e474]: D
            - cell "D" [ref=e475] [cursor=pointer]:
              - generic "Descanso" [ref=e476]: D
            - cell "T" [ref=e477] [cursor=pointer]:
              - generic "Tarde" [ref=e478]: T
            - cell "T" [ref=e479] [cursor=pointer]:
              - generic "Tarde" [ref=e480]: T
            - cell "T" [ref=e481] [cursor=pointer]:
              - generic "Tarde" [ref=e482]: T
            - cell "T" [ref=e483] [cursor=pointer]:
              - generic "Tarde" [ref=e484]: T
            - cell "T" [ref=e485] [cursor=pointer]:
              - generic "Tarde" [ref=e486]: T
            - cell "D" [ref=e487] [cursor=pointer]:
              - generic "Descanso" [ref=e488]: D
            - cell "D" [ref=e489] [cursor=pointer]:
              - generic "Descanso" [ref=e490]: D
            - cell "M" [ref=e491] [cursor=pointer]:
              - generic "Mañana" [ref=e492]: M
            - cell "M" [ref=e493] [cursor=pointer]:
              - generic "Mañana" [ref=e494]: M
            - cell "M" [ref=e495] [cursor=pointer]:
              - generic "Mañana" [ref=e496]: M
            - cell "M" [ref=e497] [cursor=pointer]:
              - generic "Mañana" [ref=e498]: M
            - cell "M" [ref=e499] [cursor=pointer]:
              - generic "Mañana" [ref=e500]: M
            - cell "D" [ref=e501] [cursor=pointer]:
              - generic "Descanso" [ref=e502]: D
            - cell "D" [ref=e503] [cursor=pointer]:
              - generic "Descanso" [ref=e504]: D
            - cell "T" [ref=e505] [cursor=pointer]:
              - generic "Tarde" [ref=e506]: T
            - cell "T" [ref=e507] [cursor=pointer]:
              - generic "Tarde" [ref=e508]: T
            - cell "T" [ref=e509] [cursor=pointer]:
              - generic "Tarde" [ref=e510]: T
            - cell "T" [ref=e511] [cursor=pointer]:
              - generic "Tarde" [ref=e512]: T
            - cell "T" [ref=e513] [cursor=pointer]:
              - generic "Tarde" [ref=e514]: T
            - cell "D" [ref=e515] [cursor=pointer]:
              - generic "Descanso" [ref=e516]: D
            - cell "D" [ref=e517] [cursor=pointer]:
              - generic "Descanso" [ref=e518]: D
            - cell "M" [ref=e519] [cursor=pointer]:
              - generic "Mañana" [ref=e520]: M
            - cell "M" [ref=e521] [cursor=pointer]:
              - generic "Mañana" [ref=e522]: M
            - cell "M" [ref=e523] [cursor=pointer]:
              - generic "Mañana" [ref=e524]: M
            - cell "M:12 T:10 D:8" [ref=e525]:
              - generic [ref=e526]:
                - generic [ref=e527]: M:12
                - generic [ref=e528]: T:10
                - generic [ref=e529]: D:8
          - row "Técnico 6 M M M M D D T T T T T D D M M M M M D D T T T T T D D M M M M:12 T:10 D:8" [ref=e530]:
            - cell "Técnico 6" [ref=e531]
            - cell "M" [ref=e532] [cursor=pointer]:
              - generic "Mañana" [ref=e533]: M
            - cell "M" [ref=e534] [cursor=pointer]:
              - generic "Mañana" [ref=e535]: M
            - cell "M" [ref=e536] [cursor=pointer]:
              - generic "Mañana" [ref=e537]: M
            - cell "M" [ref=e538] [cursor=pointer]:
              - generic "Mañana" [ref=e539]: M
            - cell "D" [ref=e540] [cursor=pointer]:
              - generic "Descanso" [ref=e541]: D
            - cell "D" [ref=e542] [cursor=pointer]:
              - generic "Descanso" [ref=e543]: D
            - cell "T" [ref=e544] [cursor=pointer]:
              - generic "Tarde" [ref=e545]: T
            - cell "T" [ref=e546] [cursor=pointer]:
              - generic "Tarde" [ref=e547]: T
            - cell "T" [ref=e548] [cursor=pointer]:
              - generic "Tarde" [ref=e549]: T
            - cell "T" [ref=e550] [cursor=pointer]:
              - generic "Tarde" [ref=e551]: T
            - cell "T" [ref=e552] [cursor=pointer]:
              - generic "Tarde" [ref=e553]: T
            - cell "D" [ref=e554] [cursor=pointer]:
              - generic "Descanso" [ref=e555]: D
            - cell "D" [ref=e556] [cursor=pointer]:
              - generic "Descanso" [ref=e557]: D
            - cell "M" [ref=e558] [cursor=pointer]:
              - generic "Mañana" [ref=e559]: M
            - cell "M" [ref=e560] [cursor=pointer]:
              - generic "Mañana" [ref=e561]: M
            - cell "M" [ref=e562] [cursor=pointer]:
              - generic "Mañana" [ref=e563]: M
            - cell "M" [ref=e564] [cursor=pointer]:
              - generic "Mañana" [ref=e565]: M
            - cell "M" [ref=e566] [cursor=pointer]:
              - generic "Mañana" [ref=e567]: M
            - cell "D" [ref=e568] [cursor=pointer]:
              - generic "Descanso" [ref=e569]: D
            - cell "D" [ref=e570] [cursor=pointer]:
              - generic "Descanso" [ref=e571]: D
            - cell "T" [ref=e572] [cursor=pointer]:
              - generic "Tarde" [ref=e573]: T
            - cell "T" [ref=e574] [cursor=pointer]:
              - generic "Tarde" [ref=e575]: T
            - cell "T" [ref=e576] [cursor=pointer]:
              - generic "Tarde" [ref=e577]: T
            - cell "T" [ref=e578] [cursor=pointer]:
              - generic "Tarde" [ref=e579]: T
            - cell "T" [ref=e580] [cursor=pointer]:
              - generic "Tarde" [ref=e581]: T
            - cell "D" [ref=e582] [cursor=pointer]:
              - generic "Descanso" [ref=e583]: D
            - cell "D" [ref=e584] [cursor=pointer]:
              - generic "Descanso" [ref=e585]: D
            - cell "M" [ref=e586] [cursor=pointer]:
              - generic "Mañana" [ref=e587]: M
            - cell "M" [ref=e588] [cursor=pointer]:
              - generic "Mañana" [ref=e589]: M
            - cell "M" [ref=e590] [cursor=pointer]:
              - generic "Mañana" [ref=e591]: M
            - cell "M:12 T:10 D:8" [ref=e592]:
              - generic [ref=e593]:
                - generic [ref=e594]: M:12
                - generic [ref=e595]: T:10
                - generic [ref=e596]: D:8
          - row "Técnico 7 M M M M D D T T T T T D D M M M M M D D T T T T T D D M M M M:12 T:10 D:8" [ref=e597]:
            - cell "Técnico 7" [ref=e598]
            - cell "M" [ref=e599] [cursor=pointer]:
              - generic "Mañana" [ref=e600]: M
            - cell "M" [ref=e601] [cursor=pointer]:
              - generic "Mañana" [ref=e602]: M
            - cell "M" [ref=e603] [cursor=pointer]:
              - generic "Mañana" [ref=e604]: M
            - cell "M" [ref=e605] [cursor=pointer]:
              - generic "Mañana" [ref=e606]: M
            - cell "D" [ref=e607] [cursor=pointer]:
              - generic "Descanso" [ref=e608]: D
            - cell "D" [ref=e609] [cursor=pointer]:
              - generic "Descanso" [ref=e610]: D
            - cell "T" [ref=e611] [cursor=pointer]:
              - generic "Tarde" [ref=e612]: T
            - cell "T" [ref=e613] [cursor=pointer]:
              - generic "Tarde" [ref=e614]: T
            - cell "T" [ref=e615] [cursor=pointer]:
              - generic "Tarde" [ref=e616]: T
            - cell "T" [ref=e617] [cursor=pointer]:
              - generic "Tarde" [ref=e618]: T
            - cell "T" [ref=e619] [cursor=pointer]:
              - generic "Tarde" [ref=e620]: T
            - cell "D" [ref=e621] [cursor=pointer]:
              - generic "Descanso" [ref=e622]: D
            - cell "D" [ref=e623] [cursor=pointer]:
              - generic "Descanso" [ref=e624]: D
            - cell "M" [ref=e625] [cursor=pointer]:
              - generic "Mañana" [ref=e626]: M
            - cell "M" [ref=e627] [cursor=pointer]:
              - generic "Mañana" [ref=e628]: M
            - cell "M" [ref=e629] [cursor=pointer]:
              - generic "Mañana" [ref=e630]: M
            - cell "M" [ref=e631] [cursor=pointer]:
              - generic "Mañana" [ref=e632]: M
            - cell "M" [ref=e633] [cursor=pointer]:
              - generic "Mañana" [ref=e634]: M
            - cell "D" [ref=e635] [cursor=pointer]:
              - generic "Descanso" [ref=e636]: D
            - cell "D" [ref=e637] [cursor=pointer]:
              - generic "Descanso" [ref=e638]: D
            - cell "T" [ref=e639] [cursor=pointer]:
              - generic "Tarde" [ref=e640]: T
            - cell "T" [ref=e641] [cursor=pointer]:
              - generic "Tarde" [ref=e642]: T
            - cell "T" [ref=e643] [cursor=pointer]:
              - generic "Tarde" [ref=e644]: T
            - cell "T" [ref=e645] [cursor=pointer]:
              - generic "Tarde" [ref=e646]: T
            - cell "T" [ref=e647] [cursor=pointer]:
              - generic "Tarde" [ref=e648]: T
            - cell "D" [ref=e649] [cursor=pointer]:
              - generic "Descanso" [ref=e650]: D
            - cell "D" [ref=e651] [cursor=pointer]:
              - generic "Descanso" [ref=e652]: D
            - cell "M" [ref=e653] [cursor=pointer]:
              - generic "Mañana" [ref=e654]: M
            - cell "M" [ref=e655] [cursor=pointer]:
              - generic "Mañana" [ref=e656]: M
            - cell "M" [ref=e657] [cursor=pointer]:
              - generic "Mañana" [ref=e658]: M
            - cell "M:12 T:10 D:8" [ref=e659]:
              - generic [ref=e660]:
                - generic [ref=e661]: M:12
                - generic [ref=e662]: T:10
                - generic [ref=e663]: D:8
      - generic [ref=e664]:
        - generic [ref=e665]:
          - generic [ref=e666]: M
          - generic [ref=e667]: Mañana
        - generic [ref=e668]:
          - generic [ref=e669]: T
          - generic [ref=e670]: Tarde
        - generic [ref=e671]:
          - generic [ref=e672]: "N"
          - generic [ref=e673]: Noche
        - generic [ref=e674]:
          - generic [ref=e675]: J
          - generic [ref=e676]: Jornada normal
        - generic [ref=e677]:
          - generic [ref=e678]: D
          - generic [ref=e679]: Descanso
        - generic [ref=e680]:
          - generic [ref=e681]: V
          - generic [ref=e682]: Vacaciones
        - generic [ref=e683]:
          - generic [ref=e684]: B
          - generic [ref=e685]: Baja
    - generic [ref=e687]:
      - generic [ref=e688]:
        - heading "Turno — 01/09/2026" [level=3] [ref=e689]
        - button "Cerrar" [ref=e690]: ×
      - generic [ref=e691]:
        - button "M Mañana" [ref=e692]:
          - generic [ref=e693]: M
          - generic [ref=e694]: Mañana
        - button "T Tarde" [ref=e695]:
          - generic [ref=e696]: T
          - generic [ref=e697]: Tarde
        - button "N Noche" [ref=e698]:
          - generic [ref=e699]: "N"
          - generic [ref=e700]: Noche
        - button "J Jornada normal" [ref=e701]:
          - generic [ref=e702]: J
          - generic [ref=e703]: Jornada normal
        - button "D Descanso" [ref=e704]:
          - generic [ref=e705]: D
          - generic [ref=e706]: Descanso
        - button "V Vacaciones" [ref=e707]:
          - generic [ref=e708]: V
          - generic [ref=e709]: Vacaciones
        - button "B Baja" [ref=e710]:
          - generic [ref=e711]: B
          - generic [ref=e712]: Baja
        - button "MF Mañana Finde" [ref=e713]:
          - generic [ref=e714]: MF
          - generic [ref=e715]: Mañana Finde
        - button "TF Tarde Finde" [ref=e716]:
          - generic [ref=e717]: TF
          - generic [ref=e718]: Tarde Finde
        - button "NF Noche Finde" [ref=e719]:
          - generic [ref=e720]: NF
          - generic [ref=e721]: Noche Finde
      - generic [ref=e722]:
        - button "Limpiar celda" [ref=e723]
        - button "Cancelar" [ref=e724]
  - generic [ref=e726]: Cuadrante generado — 2608 turnos asignados
  - button "Open Next.js Dev Tools" [ref=e732] [cursor=pointer]:
    - img [ref=e733]
  - alert [ref=e736]
```

# Test source

```ts
  31  | // ─── CP-24 — Validación de contraseña débil ───────────────────────────────────
  32  | test("CP-24 — Cambio de contraseña valida requisitos", async ({ page }) => {
  33  |   try {
  34  |     await loginAsAdmin(page);
  35  |     await page.goto("/employees");
  36  |     await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
  37  | 
  38  |     // Abrir modal de contraseña
  39  |     await page.locator("button").filter({ hasText: /Clave/i }).first().click();
  40  |     await expect(page.locator('input#pwd-new')).toBeVisible({ timeout: 5_000 });
  41  | 
  42  |     // Introducir contraseña débil (< 8 chars)
  43  |     await page.fill('input#pwd-new', 'abc');
  44  |     await page.fill('input#pwd-confirm', 'abc');
  45  |     await page.locator('button[type="submit"]').click();
  46  | 
  47  |     // Debe aparecer mensaje de error
  48  |     await expect(page.locator("text=inválida")).toBeVisible({ timeout: 3_000 });
  49  | 
  50  |     // El modal permanece abierto
  51  |     await expect(page.locator('input#pwd-new')).toBeVisible();
  52  |   } catch (e) {
  53  |     await screenshotOnFail(page, "CP-24");
  54  |     throw e;
  55  |   }
  56  | });
  57  | 
  58  | // ─── CP-25 — Turnos MF/TF/NF en el selector ──────────────────────────────────
  59  | test("CP-25 — Turnos MF/TF/NF disponibles en el selector", async ({ page }) => {
  60  |   try {
  61  |     await loginAsAdmin(page);
  62  |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  63  | 
  64  |     // Abrir ShiftEditor haciendo clic en cualquier celda
  65  |     const cell = page.locator("table tbody tr").first().locator("td").nth(1);
  66  |     await cell.click();
  67  |     await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
  68  | 
  69  |     // Verificar presencia de los 3 tipos especiales
  70  |     await expect(page.locator('[data-testid="shift-btn-MF"]')).toBeVisible();
  71  |     await expect(page.locator('[data-testid="shift-btn-TF"]')).toBeVisible();
  72  |     await expect(page.locator('[data-testid="shift-btn-NF"]')).toBeVisible();
  73  | 
  74  |     // Cerrar modal
  75  |     await page.keyboard.press("Escape");
  76  |   } catch (e) {
  77  |     await screenshotOnFail(page, "CP-25");
  78  |     throw e;
  79  |   }
  80  | });
  81  | 
  82  | // ─── CP-26 — Generación automática del cuadrante ─────────────────────────────
  83  | test("CP-26 — Admin puede generar el cuadrante automáticamente", async ({ page }) => {
  84  |   try {
  85  |     await loginAsAdmin(page);
  86  |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  87  | 
  88  |     // Ir a Octubre 2026 (5 nexts, seguro sin datos al inicio del sprint)
  89  |     for (let i = 0; i < 5; i++) {
  90  |       await page.locator('[data-testid="btn-next-month"]').click();
  91  |       await page.waitForTimeout(600);
  92  |     }
  93  |     await page.waitForTimeout(1_000);
  94  | 
  95  |     // Pulsar "Generar cuadrante" (funciona tanto si está vacío como si ya tiene datos)
  96  |     await page.locator('[data-testid="btn-generate"]').click();
  97  | 
  98  |     // Esperar confirmación de generate (toast de éxito) antes de verificar tabla
  99  |     await expect(page.locator('[data-testid="toast"]')).toBeVisible({ timeout: 20_000 });
  100 |     // El grid debe mostrar la tabla con empleados
  101 |     await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
  102 |     const rows = page.locator("table tbody tr");
  103 |     expect(await rows.count()).toBeGreaterThan(0);
  104 |   } catch (e) {
  105 |     await screenshotOnFail(page, "CP-26");
  106 |     throw e;
  107 |   }
  108 | });
  109 | 
  110 | // ─── CP-27 — La generación no sobreescribe turnos manuales ───────────────────
  111 | test("CP-27 — La generación respeta los turnos manuales", async ({ page }) => {
  112 |   try {
  113 |     await loginAsAdmin(page);
  114 |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  115 | 
  116 |     // Ir a Septiembre 2026 (4 nexts desde Mayo)
  117 |     for (let i = 0; i < 4; i++) {
  118 |       await page.locator('[data-testid="btn-next-month"]').click();
  119 |       await page.waitForTimeout(600);
  120 |     }
  121 | 
  122 |     // Generar primero para que haya tabla con celdas
  123 |     await page.locator('[data-testid="btn-generate"]').click();
  124 |     await expect(page.locator('[data-testid="toast"]').first()).toBeVisible({ timeout: 20_000 });
  125 |     await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
  126 |     await page.waitForTimeout(500);
  127 | 
  128 |     // Asignar manualmente turno V (vacaciones) en día 1 del primer empleado
  129 |     const targetCell = page.locator("table tbody tr").first().locator("td").nth(1);
  130 |     await targetCell.click();
> 131 |     await expect(page.locator('[data-testid="shift-editor"]')).toBeVisible({ timeout: 5_000 });
      |                                                                ^ Error: expect.toBeVisible: Target page, context or browser has been closed
  132 |     await page.locator('[data-testid="shift-btn-V"]').click();
  133 |     await expect(page.locator('[data-testid="shift-editor"]')).not.toBeVisible({ timeout: 5_000 });
  134 |     await page.waitForTimeout(500);
  135 | 
  136 |     // Generar de nuevo
  137 |     await page.locator('[data-testid="btn-generate"]').click();
  138 |     // Usar .first() para evitar strict mode si hay varios toasts visibles
  139 |     await expect(page.locator('[data-testid="toast"]').first()).toBeVisible({ timeout: 20_000 });
  140 |     await expect(page.locator("table")).toBeVisible({ timeout: 8_000 });
  141 | 
  142 |     // La celda día 1 primer empleado debe seguir siendo V
  143 |     await expect(
  144 |       page.locator("table tbody tr").first().locator("td").nth(1).locator('[data-testid="shift-cell-V"]')
  145 |     ).toBeVisible({ timeout: 5_000 });
  146 |   } catch (e) {
  147 |     await screenshotOnFail(page, "CP-27");
  148 |     throw e;
  149 |   }
  150 | });
  151 | 
  152 | // ─── CP-28 — Botón Imprimir existe y es clicable ────────────────────────────
  153 | test("CP-28 — Botón Imprimir está disponible en el cuadrante", async ({ page }) => {
  154 |   try {
  155 |     await loginAsAdmin(page);
  156 |     await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
  157 | 
  158 |     // El botón Imprimir debe estar visible
  159 |     const printBtn = page.locator('[data-testid="btn-print"]');
  160 |     await expect(printBtn).toBeVisible({ timeout: 5_000 });
  161 | 
  162 |     // Interceptamos window.print para verificar que se llama (sin abrir diálogo real)
  163 |     await page.evaluate(() => {
  164 |       (window as unknown as { _printCalled: boolean })._printCalled = false;
  165 |       window.print = () => { (window as unknown as { _printCalled: boolean })._printCalled = true; };
  166 |     });
  167 |     await printBtn.click();
  168 |     const printCalled = await page.evaluate(() => (window as unknown as { _printCalled: boolean })._printCalled);
  169 |     expect(printCalled).toBe(true);
  170 |   } catch (e) {
  171 |     await screenshotOnFail(page, "CP-28");
  172 |     throw e;
  173 |   }
  174 | });
  175 | 
```