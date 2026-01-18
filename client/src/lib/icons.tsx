"use client";

import React from "react";
import { FileCode, FileJson, FileType, FileText, Globe, Codepen } from "lucide-react";

export const Icons = {
    php: (props: any) => <FileCode {...props} />,
    js: (props: any) => <FileCode {...props} />,
    ts: (props: any) => <FileCode {...props} />,
    html: (props: any) => <Globe {...props} />,
    css: (props: any) => <Codepen {...props} />,
    react: (props: any) => <FileCode {...props} />,
    json: (props: any) => <FileJson {...props} />,
    python: (props: any) => <FileCode {...props} />,
    go: (props: any) => <FileCode {...props} />,
    ruby: (props: any) => <FileCode {...props} />,
    md: (props: any) => <FileType {...props} />,
};
