export default function ContactPage() {
    return (
        <div className="container py-20 text-center space-y-8">
            <h1 className="text-4xl font-bold font-outfit">Contact Us</h1>
            <p className="text-muted-foreground mx-auto max-w-lg">
                Have questions about a competition or need technical support? We're here to help.
            </p>
            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto text-left py-12">
                <div className="p-8 border rounded-3xl space-y-4">
                    <h3 className="text-xl font-bold">Email Support</h3>
                    <p className="text-muted-foreground text-sm">Our team typically responds within 24 hours.</p>
                    <p className="font-bold text-primary">support@competeedu.com</p>
                </div>
                <div className="p-8 border rounded-3xl space-y-4">
                    <h3 className="text-xl font-bold">School Partnerships</h3>
                    <p className="text-muted-foreground text-sm">Register your school for the next events.</p>
                    <p className="font-bold text-primary">partners@competeedu.com</p>
                </div>
            </div>
        </div>
    );
}
