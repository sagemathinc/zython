/*
Create a .c file that exports a function that returns a pointer to
all libc function.  You must include this C code with any other code
you're compiling to build your main file if you want the dynamic
libraries you link to have access to libc.

This adds about 150KB to the wasm file (after stripping), which isn't
too bad.
*/

// I got the following by parsing https://www.ibm.com/docs/en/i/7.2?topic=extensions-standard-c-library-functions-table-by-name
// I think the functions in libc should be pretty stable.

const headers =
  "assert.h ctype.h langinfo.h locale.h math.h nl_types.h regex.h setjmp.h signal.h stdarg.h stdio.h stdlib.h string.h strings.h time.h wchar.h wctype.h";

const functions =
  "abort abs acos asctime asctime_r asin assert atan atan2 atexit atof atoi atol bsearch btowc calloc catclose catgets catopen ceil clearerr clock cos cosh ctime ctime64 ctime64_r ctime_r difftime difftime64 div erf erfc exit exp fabs fclose fdopen feof ferror fflush fgetc fgetpos fgets fgetwc fgetws fileno floor fmod fopen fprintf fputc fputs fputwc fputws fread free freopen frexp fscanf fseek fsetpos ftell fwide fwprintf fwrite fwscanf gamma getc getchar getenv gets getwc getwchar gmtime gmtime64 gmtime64_r gmtime_r hypot isalnum isalpha isascii isblank iscntrl isdigit isgraph islower isprint ispunct isspace isupper iswalnum iswalpha iswblank iswcntrl iswctype iswdigit iswgraph iswlower iswprint iswpunct iswspace iswupper iswxdigit isxdigit j0 j1 jn labs ldexp ldiv localeconv localtime localtime64 localtime64_r localtime_r log log10 longjmp malloc mblen mbrlen mbrtowc mbsinit mbsrtowcs mbstowcs mbtowc memchr memcmp memcpy memmove memset mktime mktime64 modf nextafter nextafterl nexttoward nexttowardl nl_langinfo perror pow printf putc putchar putenv puts putwc putwchar qsort quantexpd128 quantexpd32 quantexpd64 quantized128 quantized32 quantized64 raise rand rand_r realloc regcomp regerror regexec regfree remove rename rewind samequantumd128 samequantumd32 samequantumd64 scanf setbuf setjmp setlocale setvbuf signal sin sinh snprintf sprintf sqrt srand sscanf strcasecmp strcat strchr strcmp strcoll strcpy strcspn strerror strfmon strftime strlen strncasecmp strncat strncmp strncpy strpbrk strptime strrchr strspn strstr strtod strtod128 strtod32 strtod64 strtof strtok strtok_r strtol strtold strtoul strxfrm swprintf swscanf system tan tanh time time64 tmpfile tmpnam toascii tolower toupper towctrans towlower towupper ungetc ungetwc va_arg va_copy va_end va_start vfprintf vfscanf vfwprintf vfwscanf vprintf vscanf vsnprintf vsprintf vsscanf vswprintf vswscanf vwprintf vwscanf wcrtomb wcscat wcschr wcscmp wcscoll wcscpy wcscspn wcsftime wcslen wcslocaleconv wcsncat wcsncmp wcsncpy wcspbrk wcsptime wcsrchr wcsrtombs wcsspn wcsstr wcstod wcstod128 wcstod32 wcstod64 wcstof wcstok wcstol wcstold wcstombs wcstoul wcsxfrm wctob wctomb wctrans wctype wcwidth wmemchr wmemcmp wmemcpy wmemmove wmemset wprintf wscanf y0 y1 yn";

// These are in libc but NOT WASI (at least in zig 0.10), as I found out
// by tedious trial and error.
// We also have to exclude assert since it is a macro.
const exclude =
  "assert setjmp.h setjmp longjmp clock ctime64 ctime64_r difftime64 signal.h signal gamma gets gmtime64 gmtime64_r localtime64 localtime64_r mktime64 quantexpd128 quantexpd32 quantexpd64 quantized128 quantized32 quantized64 raise samequantumd128 samequantumd32 samequantumd64 wcslocaleconv wcsptime wcstod128 wcstod32 wcstod64 va_arg strfmon strtod128 strtod32 strtod64 time64 va_arg qsort regcomp system tmpfile tmpnam va_copy va_end va_start va_arg";

function main() {
  const omit = new Set(exclude.split(" "));
  let s = '#define VISIBLE __attribute__((visibility("default")))\n\n';
  for (const header of headers.split(" ")) {
    if (omit.has(header)) continue;
    s += `#include<${header}>\n`;
  }
  for (const func of functions.split(" ")) {
    if (omit.has(func)) continue;
    s += `VISIBLE void* libc_${func}() { return &${func}; } \n`;
  }
  console.log(s);
}

main();
export {};
