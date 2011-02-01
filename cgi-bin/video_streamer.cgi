#!/usr/bin/perl
use strict;
use warnings;
use File::stat;

use CGI;

my $q = CGI->new;

# Code taken from http://stackoverflow.com/questions/815670/how-can-i-serve-an-image-with-a-perl-cgi-script

my $file = "../timelapses/brassica1-15m-halfsize/r.mp4";
#my $file = "../images/error.png";
my $length = stat($file)->size;
print "Content-length: $length\n";
print "Content-type: video/mp4\n\n";
#print "Content-type: image/png\n\n";

open (FH, '<', $file) || die "Could not open $file: $!";
my $buffer;
binmode STDOUT;
while (read(FH, $buffer, 10240)) {
    print $buffer;
}
close(FH);
