(async function () {

    class MediaRange {
        constructor() {
            this.type = "";
            this.subtype = "";
            this.weight = {};
            this.parameter = {};
            this['accept-ext'] = {};
        }
    }

    class HTTPParser {
        constructor(options) {

            this.parseMediaRange = this.parseMediaRange.bind(this);
        }

        async parseMediaRange(header) {

            let mediaRange = new MediaRange();
            let part = "";
            let token = "";
            let quoted = false;
            let escaped = false;
            let context = "type";
            let ows = false;

            let index = 0; while (true) {

                let char = header[index];

                if (typeof char == "undefined") {

                    if (context == "parameter" && token && part) {

                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && part) {
                        if (token) {
                            mediaRange[context][token] = part;
                        }
                        else {
                            mediaRange[context][part] = "";
                        }
                    }
                    else if (context == "subtype" && part) {

                        mediaRange[context] = part;
                    }
                    else {
                        throw new Error();
                    }

                    return [mediaRange];
                }

                if (char == ";") {

                    if (quoted) {
                        part = part + char;
                    }
                    else {
                        if (context == "subtype" && part) {
                            mediaRange[context] = part;
                            context = "parameter"
                        }
                        else if (context == "parameter" && token && part) {

                            if (token == "q" && !mediaRange.weight.q) {
                                mediaRange["weight"]["q"] = part;
                                context = "accept-ext";
                            }
                            else {
                                mediaRange[context][token] = part;
                            }
                        }
                        else if (context == "accept-ext" && token) {
                            mediaRange[context][token] = part;
                        }
                        else if (context == "accept-ext" && !token) {
                            mediaRange[context][part] = "";
                        }
                        else {
                            throw new Error();
                        }
                        part = "";
                        token = "";
                        ows = false;
                    }
                }
                else if (char == "=") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "parameter" && part) {
                        token = part;
                        part = "";
                    }
                    else if (context == "accept-ext" && part) {
                        token = part;
                        part = "";
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "/") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "type" && part) {
                        mediaRange[context] = part;
                        part = "";
                        context = "subtype";
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == '"') {
                    if (quoted) {

                        if (escaped) {
                            part = part + char;
                            escaped = false;
                        }
                        else if (context == "parameter") {
                            quoted = false;
                        }
                        else if (context == "accept-ext") {
                            quoted = false;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (token && !part) {
                        quoted = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == "\\") {
                    if (quoted && escaped) {
                        part = part + char;
                        escaped = false;
                    }
                    else if (quoted && !escaped) {
                        escaped = true;
                    }
                    else {
                        throw new Error();
                    }
                }
                else if (char == ",") {

                    if (quoted) {
                        part = part + char;
                    }
                    else if (context == "subtype" && part) {
                        mediaRange[context] = part;
                    }
                    else if (context == "parameter" && token && part) {
                        if (token == "q" && !mediaRange.weight.q) {
                            mediaRange["weight"]["q"] = part;
                        }
                        else {
                            mediaRange[context][token] = part;
                        }
                    }
                    else if (context == "accept-ext" && token) {
                        mediaRange[context][token] = part;
                    }
                    else if (context == "accept-ext" && !token) {
                        mediaRange[context][part] = "";
                    }
                    else {
                        throw new Error();
                    }

                    await new Promise((r, j) => setTimeout(() => r()));

                    return [mediaRange].concat(await this.parseMediaRange(header.slice(++index)));
                }
                else if (ows) {
                    if (!this.isows(char)) {
                        throw new Error();
                    }
                }
                else {
                    if (context == "type") {

                        if (!part && this.isows(char)) {

                        }
                        else if (this.istchar(char)) {
                            part = part + char;
                        }
                        else {
                            console.log(mediaRange)
                            console.log(char);
                            throw new Error();
                        }
                    }
                    else if (context == "subtype") {

                        if (!ows && this.istchar(char)) {
                            part = part + char;
                        }
                        else if (part && this.isows(char)) {
                            ows = true;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (context == "parameter" && token) {
                        //  We have a token; hence, it is a value.

                        if (quoted) {
                            part = part + char;
                        }
                        else {
                            if (!ows && this.istchar(char)) {
                                part = part + char;
                            }
                            else if (part && this.isows(char)) {
                                ows = true;
                            }
                            else {
                                throw new Error();
                            }
                        }
                    }
                    else if (context == "parameter" && !token) {
                        //  We do not have a token; hence, it is a name.
                        if (!part && this.isows(char)) {
                        }
                        else if (this.istchar(char)) {
                            part = part + char;
                        }
                        else {
                            throw new Error();
                        }
                    }
                    else if (context == "accept-ext" && token) {
                        part = part + char;
                    }
                    else if (context == "accept-ext" && !token) {
                        part = part + char;
                    }
                    else {
                        throw new Error();
                    }
                }
                index = index + 1;
            }
        }

        istchar(char) {
            for (let delim of '"(),/:;<=>?@[\\]{}') {
                if (char === delim){
                    return false;
                }
            }
            let codePoint = char.codePointAt(0);
            return codePoint >= 33 && codePoint <= 126
        }

        isqdtext(char) {
            let codePoint = char.codePointAt(0);
            return (
                codePoint == 9 || // HTAB
                codePoint == 32 || // SP
                codePoint == 33 || // %x21
                (codePoint >= 35 && codePoint <= 91) || // %x23-5B
                (codePoint >= 93 && codePoint <= 126) || // %x5D-7E
                (codePoint >= 128 && codePoint <= 255) // %x80-FF
            )
        }

        isows(char) {
            let codePoint = char.codePointAt(0);
            return codePoint == 9 || codePoint == 32
        }
    }

    let accept_header = 'text/*;q=0.3, text/html;q=0.7,text/html;level=1,text/htmla  ; lev=2   ;level=3.0;q=0.4, */*;q=0.5;level="123"';

    console.log(accept_header);

    httpParser = new HTTPParser();

    let mediaRanges = null;

    try {
        mediaRanges = await httpParser.parseMediaRange(accept_header);
    }
    catch (e) {
        console.log(e);
    }

    console.log(mediaRanges);
}());